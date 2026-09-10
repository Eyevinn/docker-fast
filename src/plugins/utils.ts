import {
  AudioTracks,
  ChannelProfile,
  SubtitleTracks
} from 'eyevinn-channel-engine';
import { Language, StitchPayload } from './interface';
import fetch from 'node-fetch';

import { uuid } from 'uuidv4';

const DEFAULT_VIDEO_STREAMS: ChannelProfile[] = [
  { bw: 324586, codecs: 'avc1.64000D,mp4a.40.2', resolution: [416, 234] },
  { bw: 471661, codecs: 'avc1.64001E,mp4a.40.2', resolution: [640, 360] },
  { bw: 584829, codecs: 'avc1.64001E,mp4a.40.2', resolution: [768, 432] },
  { bw: 799817, codecs: 'avc1.64001F,mp4a.40.2', resolution: [960, 540] },
  { bw: 2248046, codecs: 'avc1.64001F,mp4a.40.2', resolution: [1280, 720] },
  { bw: 9602303, codecs: 'avc1.640028,mp4a.40.2', resolution: [1920, 1080] }
];

const DEFAULT_AUDIO_TRACKS: AudioTracks[] = [
  { language: 'en', name: 'English', default: true }
];

const DEFAULT_SUBTITLE_TRACKS: SubtitleTracks[] = [
  { language: 'sv', name: 'Swedish', default: true }
];

const CHANNEL_PRESETS = {
  ATMOS: {
    video: [
      {
        resolution: [640, 360],
        bw: 3663471,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1280, 720],
        bw: 5841380,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1920, 1080],
        bw: 8973571,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },

      {
        resolution: [640, 360],
        bw: 4301519,
        codecs: 'avc1.64001F,ec-3',
        channels: '16/JOC'
      },
      {
        resolution: [1280, 720],
        bw: 6479428,
        codecs: 'avc1.64001F,ec-3',
        channels: '16/JOC'
      },
      {
        resolution: [1920, 1080],
        bw: 9611619,
        codecs: 'avc1.640032,ec-3',
        channels: '16/JOC'
      }
    ],
    audio: [{ language: 'en', name: 'English', default: true }]
  },
  DD: {
    video: [
      {
        resolution: [640, 360],
        bw: 3663471,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1280, 720],
        bw: 5841380,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1920, 1080],
        bw: 8973571,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },

      {
        resolution: [640, 360],
        bw: 4301519,
        codecs: 'avc1.64001F,ac-3',
        channels: '6'
      },
      {
        resolution: [1280, 720],
        bw: 6479428,
        codecs: 'avc1.64001F,ac-3',
        channels: '6'
      },
      {
        resolution: [1920, 1080],
        bw: 9611619,
        codecs: 'avc1.640032,ac-3',
        channels: '6'
      }
    ],
    audio: [{ language: 'en', name: 'English', default: true }]
  },
  HEVC: {
    video: [
      {
        resolution: [640, 360],
        bw: 1078026,
        codecs: 'hvc1.2.4.L123.90,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1280, 720],
        bw: 2627520,
        codecs: 'hvc1.2.4.L123.90,mp4a.40.2',
        channels: 2
      },
      {
        resolution: [1920, 1080],
        bw: 4589413,
        codecs: 'hvc1.2.4.L123.90,mp4a.40.2',
        channels: 2
      }
    ],
    audio: [{ language: 'en', name: 'English', default: true }]
  }
};

function parseOptsVideoStreams(optsVideoStream?: string): ChannelProfile[] {
  if (!optsVideoStream) {
    return DEFAULT_VIDEO_STREAMS;
  }

  const streams = [];
  optsVideoStream.split(',').forEach((item) => {
    const m = item.match(/^(\d+)x(\d+):(\d+)/);
    if (m) {
      const stream = {
        bw: parseInt(m[3]),
        codecs: 'avc1.4d001f,mp4a.40.2',
        resolution: [parseInt(m[1]), parseInt(m[2])]
      };
      streams.push(stream);
    }
  });

  return streams;
}

function streamByHeight(streams, height: number) {
  return streams.find((r) => r.resolution[1] === height);
}

export function getDefaultChannelVideoProfile(): ChannelProfile[] {
  if (
    process.env.OPTS_CHANNEL_PRESET &&
    CHANNEL_PRESETS[process.env.OPTS_CHANNEL_PRESET]
  ) {
    const videoProfile = CHANNEL_PRESETS[process.env.OPTS_CHANNEL_PRESET].video;
    return videoProfile;
  } else {
    let streams = parseOptsVideoStreams(process.env.OPTS_VIDEO_STREAMS);
    if (process.env.OPTS_STREAM_ORDER) {
      const newStreams = [];
      const streamOrder = process.env.OPTS_STREAM_ORDER.split(',');
      for (const height of streamOrder) {
        const stream = streamByHeight(streams, parseInt(height));
        if (stream) {
          newStreams.push(stream);
        }
      }
      streams = newStreams;
    }
    return streams;
  }
}

export function getDefaultChannelAudioProfile(): AudioTracks[] {
  const langList = process.env.OPTS_LANG_LIST;
  if (langList) {
    const audioTracks = [];
    const languages = langList.split(',');
    for (let i = 0; i < languages.length; i++) {
      const lang: Language = {
        language: languages[i],
        name: languages[i],
        default: i === 0
      };
      audioTracks.push(lang);
    }
    return audioTracks;
  } else if (
    process.env.OPTS_CHANNEL_PRESET &&
    CHANNEL_PRESETS[process.env.OPTS_CHANNEL_PRESET]
  ) {
    return CHANNEL_PRESETS[process.env.OPTS_CHANNEL_PRESET].audio;
  } else {
    return DEFAULT_AUDIO_TRACKS;
  }
}

export function getDefaultChannelSubtitleProfile(): SubtitleTracks[] {
  const langList = process.env.OPTS_LANG_LIST_SUBS;
  if (langList) {
    const subtitleTracks = [];
    const languages = langList.split(',');
    for (let i = 0; i < languages.length; i++) {
      const lang: Language = {
        language: languages[i],
        name: languages[i],
        default: i === 0
      };
      subtitleTracks.push(lang);
    }
    return subtitleTracks;
  } else {
    return DEFAULT_SUBTITLE_TRACKS;
  }
}

export function generateId(): string {
  return uuid();
}

// Supported codec-family preferences, expressed with standard HLS CODECS tokens.
export type CodecPreference = 'avc1' | 'hvc1';

// Map a raw CODECS attribute value to the video codec family it belongs to.
// Only the video token matters here; audio-only tokens (mp4a, ac-3, ...) do not
// identify a video family and are treated as "no video family".
function videoCodecFamily(codecs: string): CodecPreference | null {
  if (/\bavc1\b/i.test(codecs)) return 'avc1';
  // hev1 is the alternate sample-entry spelling of the same family as hvc1.
  if (/\bhvc1\b|\bhev1\b/i.test(codecs)) return 'hvc1';
  return null;
}

/**
 * Read the configured codec preference from the environment.
 *
 * When unset (the default) filtering is disabled and multicodec masters are
 * passed through untouched, preserving current behavior. Set
 * OPTS_CODEC_PREFERENCE to `avc1` or `hvc1` to have docker-fast keep only the
 * matching video variants from a multicodec source master.
 */
export function getCodecPreference(): CodecPreference | undefined {
  const raw = (process.env.OPTS_CODEC_PREFERENCE || '').trim().toLowerCase();
  if (raw === 'avc1' || raw === 'avc') return 'avc1';
  if (raw === 'hvc1' || raw === 'hev1' || raw === 'hevc') return 'hvc1';
  return undefined;
}

/**
 * Filter an HLS master manifest so that only variants of the preferred video
 * codec family remain.
 *
 * The engine (via @eyevinn/hls-vodtolive) indexes variant media playlists by
 * bandwidth only. When a master mixes codec families and two variants share a
 * bandwidth, the buckets collapse and the advertised CODECS can end up pointing
 * at segments of the wrong codec. Filtering to a single family here — before the
 * master reaches the engine — guarantees every advertised CODECS matches the
 * segments actually served.
 *
 * Behavior:
 *  - If `preference` is undefined, the master is returned unchanged.
 *  - If the master has variants from only one video family (or none), it is
 *    returned unchanged (single-codec sources are never altered).
 *  - Otherwise only the preferred family's #EXT-X-STREAM-INF variants (and their
 *    following URI line) are kept; other tags and lines pass through untouched.
 */
export function filterMasterByCodecPreference(
  masterManifest: string,
  preference?: CodecPreference
): string {
  if (!preference) {
    return masterManifest;
  }

  const lines = masterManifest.split(/\r?\n/);

  // First pass: which video families are present among the variant streams?
  const families = new Set<CodecPreference>();
  for (const line of lines) {
    if (/^#EXT-X-STREAM-INF:/i.test(line)) {
      const codecsMatch = line.match(/CODECS="([^"]*)"/i);
      const family = videoCodecFamily(codecsMatch ? codecsMatch[1] : '');
      if (family) {
        families.add(family);
      }
    }
  }

  // Nothing to do for single-family (or codec-less) masters.
  if (families.size < 2 || !families.has(preference)) {
    return masterManifest;
  }

  // Second pass: drop any #EXT-X-STREAM-INF (and its following URI line) whose
  // video family is not the preferred one. Non-variant lines are preserved.
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#EXT-X-STREAM-INF:/i.test(line)) {
      const codecsMatch = line.match(/CODECS="([^"]*)"/i);
      const family = videoCodecFamily(codecsMatch ? codecsMatch[1] : '');
      // The URI for a variant is the next non-empty, non-comment line.
      let uriIdx = i + 1;
      while (uriIdx < lines.length && lines[uriIdx].trim() === '') {
        uriIdx++;
      }
      if (family && family !== preference) {
        // Skip this stream-inf and its URI line.
        i = uriIdx;
        continue;
      }
    }
    out.push(line);
  }

  return out.join('\n');
}

/**
 * Rewrite the variant URIs in a master manifest to absolute URLs, resolved
 * against the original master URL.
 *
 * When docker-fast serves a filtered copy of a master from its own endpoint, the
 * engine would otherwise resolve the (relative) variant playlist URIs against
 * docker-fast's URL instead of the upstream origin. Making them absolute keeps
 * variant/segment resolution pointing at the real source.
 */
export function absolutizeMasterVariants(
  masterManifest: string,
  sourceMasterUrl: string
): string {
  const lines = masterManifest.split(/\r?\n/);
  const out: string[] = [];
  let expectUri = false;
  for (const line of lines) {
    if (expectUri && line.trim() !== '' && !line.startsWith('#')) {
      try {
        out.push(new URL(line.trim(), sourceMasterUrl).toString());
      } catch {
        out.push(line);
      }
      expectUri = false;
      continue;
    }
    if (/^#EXT-X-STREAM-INF:/i.test(line)) {
      expectUri = true;
    }
    out.push(line);
  }
  return out.join('\n');
}

// Path prefix for docker-fast's self-hosted codec-filtering master endpoint.
export const CODEC_FILTER_PATH = '/codecfilter/master.m3u8';

/**
 * Base URL of docker-fast's own HTTP server (the one that hosts the UI and the
 * codec-filter endpoint), used to build self-referencing filtered-master URLs.
 * Defaults to the local UI server; override with OPTS_MASTER_FILTER_BASE_URL
 * when docker-fast is reachable at a different address (e.g. behind a proxy).
 */
export function getMasterFilterBaseUrl(): string {
  if (process.env.OPTS_MASTER_FILTER_BASE_URL) {
    return process.env.OPTS_MASTER_FILTER_BASE_URL.replace(/\/$/, '');
  }
  const port = process.env.UI_PORT || '8001';
  return `http://127.0.0.1:${port}`;
}

/**
 * If a codec preference is configured, return a docker-fast-hosted URL that
 * serves a codec-filtered copy of the given source master. Otherwise return the
 * source URL unchanged, preserving current behavior.
 */
export function codecFilteredVodUri(sourceUri: string): string {
  const preference = getCodecPreference();
  if (!preference) {
    return sourceUri;
  }
  return `${getMasterFilterBaseUrl()}${CODEC_FILTER_PATH}?src=${encodeURIComponent(
    sourceUri
  )}`;
}

function serialize<T>(payload: T) {
  const buff = Buffer.from(JSON.stringify(payload));
  return buff.toString('base64');
}

export function getVodUrlWithPreroll(
  url: string,
  prerollUrl: string,
  prerollDurationMs: number
): string {
  if (process.env.OPTS_STITCH_ENDPOINT) {
    const payload: StitchPayload = {
      uri: codecFilteredVodUri(url),
      breaks: [
        {
          pos: 0,
          duration: prerollDurationMs,
          url: prerollUrl
        }
      ]
    };
    return (
      process.env.OPTS_STITCH_ENDPOINT +
      `/master.m3u8?payload=` +
      serialize<StitchPayload>(payload)
    );
  }
  return codecFilteredVodUri(url);
}

export async function resolveRedirect(url: string) {
  try {
    const response = await fetch(url);
    if (response.redirected) {
      console.log('Redirect: ' + response.url);
      return response.url || url;
    }
  } catch (err) {
    console.error(err);
  }
  return url;
}
