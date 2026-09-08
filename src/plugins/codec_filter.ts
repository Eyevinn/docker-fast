import { Readable } from 'stream';
import fetch from 'node-fetch';

// eyevinn-channel-engine and @eyevinn/hls-vodtolive both depend on @eyevinn/m3u8,
// so it is available transitively. It is plain JS without bundled types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const m3u8 = require('@eyevinn/m3u8');

/**
 * A video codec family used to disambiguate multicodec HLS masters.
 *
 * These are the leading four-character HLS `CODECS` sample-entry prefixes as
 * defined by RFC 6381 / the HLS spec — not product names. `avc1`/`hvc1` are the
 * canonical prefixes; `avc3`/`hev1` are the in-band-parameter-set variants that
 * belong to the same families and normalize onto them.
 */
export type VideoCodecFamily = 'avc1' | 'hvc1' | 'av01';

/**
 * The video codec-family prefixes the filter recognizes, in normalization
 * order. Each entry maps one or more HLS `CODECS` sample-entry prefixes to a
 * single canonical family.
 */
const VIDEO_CODEC_FAMILIES: { family: VideoCodecFamily; prefixes: string[] }[] =
  [
    { family: 'avc1', prefixes: ['avc1', 'avc3'] },
    { family: 'hvc1', prefixes: ['hvc1', 'hev1'] },
    { family: 'av01', prefixes: ['av01'] }
  ];

/**
 * Default preference order applied when a source master mixes video codec
 * families. AVC (`avc1`) is preferred over HEVC (`hvc1`) because it is the more
 * broadly decodable family, which keeps the default behavior conservative.
 *
 * The first entry present in the source wins. If none of the preferred families
 * is present the source's own first-seen family is kept (graceful fallback), so
 * the master is never emptied.
 */
export const DEFAULT_VIDEO_CODEC_PREFERENCE: VideoCodecFamily[] = [
  'avc1',
  'hvc1'
];

/**
 * Resolve the configured video codec preference from the environment.
 *
 * `OPTS_PREFERRED_VIDEO_CODEC` accepts a comma-separated preference list of HLS
 * codec-family prefixes (e.g. `hvc1,avc1` to prefer HEVC). When unset the
 * default preference is used. Unknown / empty tokens are ignored; if nothing
 * usable remains the default is returned, so single-codec sources are always
 * passed through unchanged regardless of configuration.
 */
export function getPreferredVideoCodecs(
  optsPreferredVideoCodec?: string
): VideoCodecFamily[] {
  const raw =
    optsPreferredVideoCodec !== undefined
      ? optsPreferredVideoCodec
      : process.env.OPTS_PREFERRED_VIDEO_CODEC;
  if (!raw) {
    return DEFAULT_VIDEO_CODEC_PREFERENCE;
  }
  const known = new Set(VIDEO_CODEC_FAMILIES.map((f) => f.family));
  const parsed = raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t): t is VideoCodecFamily => known.has(t as VideoCodecFamily));
  return parsed.length > 0 ? parsed : DEFAULT_VIDEO_CODEC_PREFERENCE;
}

/**
 * Map a single HLS `CODECS` attribute value to its video codec family, if any.
 *
 * Returns `undefined` for audio-only / non-video renditions (e.g. `mp4a.40.2`),
 * so those variants are never dropped by the filter.
 */
export function videoCodecFamilyOf(
  codecs: string | undefined
): VideoCodecFamily | undefined {
  if (!codecs) {
    return undefined;
  }
  const tokens = codecs
    .toLowerCase()
    .split(',')
    .map((t) => t.trim());
  for (const { family, prefixes } of VIDEO_CODEC_FAMILIES) {
    if (tokens.some((t) => prefixes.some((p) => t.startsWith(p)))) {
      return family;
    }
  }
  return undefined;
}

/**
 * Filter a parsed master manifest down to a single video codec family when the
 * source mixes families, so downstream bandwidth-keyed variant selection can
 * never mix codecs.
 *
 * Behavior:
 * - Single video codec family (or none) => the master is returned untouched
 *   (current behavior preserved).
 * - Multiple video codec families => keep only variants of the first family in
 *   `preference` that is actually present; if none of the preferred families is
 *   present, keep the source's first-seen family (graceful fallback).
 * - Audio-only / non-video `#EXT-X-STREAM-INF` variants and every
 *   `#EXT-X-MEDIA` group are always kept.
 *
 * Returns the chosen family (or `undefined` when no filtering was applied),
 * which is useful for logging/tests.
 */
export function filterMasterManifestByCodec(
  m3u: any,
  preference: VideoCodecFamily[] = DEFAULT_VIDEO_CODEC_PREFERENCE
): VideoCodecFamily | undefined {
  const streamItems = m3u.items.StreamItem || [];

  // Collect the video codec families present, preserving first-seen order.
  const presentFamilies: VideoCodecFamily[] = [];
  for (const item of streamItems) {
    const family = videoCodecFamilyOf(item.get('codecs'));
    if (family && !presentFamilies.includes(family)) {
      presentFamilies.push(family);
    }
  }

  // Nothing to disambiguate: single-codec (or codec-less) source passes through.
  if (presentFamilies.length < 2) {
    return undefined;
  }

  // Pick the first preferred family that exists, else fall back to the source's
  // first-seen family so the master is never emptied.
  const chosen =
    preference.find((fam) => presentFamilies.includes(fam)) ||
    presentFamilies[0];

  // Rebuild StreamItem list keeping non-video variants and the chosen family.
  const kept = streamItems.filter((item: any) => {
    const family = videoCodecFamilyOf(item.get('codecs'));
    return family === undefined || family === chosen;
  });
  m3u.items.StreamItem = kept;

  return chosen;
}

/**
 * Parse a master manifest from a Readable stream and resolve the parsed M3U.
 */
function parseMaster(stream: Readable): Promise<any> {
  return new Promise((resolve, reject) => {
    const parser = m3u8.createStream();
    parser.on('m3u', (m3u: any) => resolve(m3u));
    parser.on('error', (err: Error) => reject(err));
    stream.pipe(parser);
    stream.on('error', (err: Error) => reject(err));
  });
}

/**
 * Build a master-manifest injector suitable for `HLSVod.load(masterFetcher, ...)`
 * that fetches (or reuses) the source master, filters it to a single video
 * codec family per the configured preference, and returns the filtered master
 * as a Readable stream.
 *
 * `source` may be a master manifest URL (fetched via node-fetch) or a factory
 * returning a Readable stream of the source master (handy for tests/proxying).
 *
 * The filter only removes variants when the source mixes multiple video codec
 * families; single-codec masters are re-serialized unchanged.
 */
export function createCodecFilteringMasterLoader(
  source: string | (() => Readable),
  preference: VideoCodecFamily[] = DEFAULT_VIDEO_CODEC_PREFERENCE
): () => Readable {
  return () => {
    // The stream is push-based (data arrives from the async fetch/parse below),
    // so `read` is intentionally a no-op.
    const out = new Readable({
      read() {
        return;
      }
    });

    const getSource = async (): Promise<Readable> => {
      if (typeof source === 'string') {
        const res = await fetch(source);
        if (!res.ok) {
          throw new Error(
            `${res.status}:: status code error retrieving master manifest ${source}`
          );
        }
        return res.body as unknown as Readable;
      }
      return source();
    };

    getSource()
      .then((stream) => parseMaster(stream))
      .then((m3u) => {
        filterMasterManifestByCodec(m3u, preference);
        out.push(m3u.toString());
        out.push(null);
      })
      .catch((err) => {
        out.destroy(err);
      });

    return out;
  };
}
