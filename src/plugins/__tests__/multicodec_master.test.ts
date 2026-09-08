/**
 * Codec-preference test for docker-fast#65 (was the #63 characterization test).
 *
 * Reported bug (#63/#36): an HLS master containing BOTH HEVC (hvc1) and AVC
 * (avc1) variants makes the engine advertise one codec in the master manifest
 * CODECS attribute while the segments actually delivered at that bandwidth are
 * the other codec. The reported trigger is two variants sharing the SAME
 * BANDWIDTH.
 *
 * docker-fast packages the channel engine, which builds the client-facing
 * master manifest straight from `HLSVod.getUsageProfiles()` — one
 * `#EXT-X-STREAM-INF ... CODECS="..."` line per usage profile, each pointing to
 * `master<bw>.m3u8` (see eyevinn-channel-engine session.js). The variant media
 * playlist served for a bandwidth comes from `HLSVod.getMediaSegments()[bw]`.
 * Because segments are keyed by BANDWIDTH ONLY, two colliding-bandwidth variants
 * collapse to a single set of segments, so at least one advertised codec ends up
 * pointing at segments of the wrong codec.
 *
 * FIX (#65, PREFERRED approach): filter the SOURCE master to a single video
 * codec family BEFORE it reaches `HLSVod`, so bandwidth buckets never mix
 * codecs. This test now feeds the master through
 * `createCodecFilteringMasterLoader` (the same seam docker-fast uses) and
 * asserts the FIXED behavior: only the preferred codec family survives and every
 * advertised CODECS matches the codec of the segments served at that bandwidth.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import {
  createCodecFilteringMasterLoader,
  filterMasterManifestByCodec,
  videoCodecFamilyOf,
  getPreferredVideoCodecs
} from '../codec_filter';

// eyevinn-channel-engine re-exports the HLSVod class from @eyevinn/hls-vodtolive,
// which docker-fast pulls in transitively. Require it directly since it is plain
// JS without bundled types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HLSVod = require('@eyevinn/hls-vodtolive');

const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'multicodec');

interface UsageProfile {
  bw: number;
  resolution?: string;
  codecs?: string;
}

interface Segment {
  uri?: string;
  discontinuity?: boolean;
}

// Map an advertised CODECS string to the codec family we expect the segment
// URIs to belong to in this fixture.
function codecFamily(codecs: string): 'avc' | 'hevc' | 'unknown' {
  if (/avc1/.test(codecs)) return 'avc';
  if (/hvc1|hev1/.test(codecs)) return 'hevc';
  return 'unknown';
}

function segmentFamily(uri: string): 'avc' | 'hevc' | 'unknown' {
  if (/avc_/.test(uri)) return 'avc';
  if (/hevc_/.test(uri)) return 'hevc';
  return 'unknown';
}

function fixtureStream(name: string): () => Readable {
  return () => fs.createReadStream(path.join(FIXTURE_DIR, name));
}

// The engine loads variant media playlists keyed by bandwidth. Serve each
// variant's media playlist by BANDWIDTH+something is impossible (bandwidth is
// the only key), so we route the media fetch by inspecting the (now filtered)
// master's variant URIs via a per-bandwidth map that reflects the SURVIVING
// variant only.
function mediaLoaderFor(mediaByBw: {
  [bw: string]: string;
}): (bandwidth: string | number) => Readable {
  return (bandwidth) => {
    const fname = mediaByBw[String(bandwidth)];
    if (!fname) {
      throw new Error(`no media fixture for bandwidth ${bandwidth}`);
    }
    return fs.createReadStream(path.join(FIXTURE_DIR, fname));
  };
}

interface Vod {
  load: (
    m: () => unknown,
    mm: (bw: string | number) => unknown
  ) => Promise<void>;
  getUsageProfiles: () => UsageProfile[];
  getBandwidths: () => string[];
  getMediaSegments: () => { [bw: string]: Segment[] };
}

function servedFamilyByBandwidth(vod: Vod): {
  [bw: string]: 'avc' | 'hevc' | 'unknown';
} {
  const segments = vod.getMediaSegments();
  const served: { [bw: string]: 'avc' | 'hevc' | 'unknown' } = {};
  Object.keys(segments).forEach((bw) => {
    const firstSeg = segments[bw].find((s) => s.uri);
    served[bw] = firstSeg ? segmentFamily(firstSeg.uri as string) : 'unknown';
  });
  return served;
}

describe('multicodec HEVC+AVC master manifest — codec preference (docker-fast#65)', () => {
  describe('unit: filterMasterManifestByCodec', () => {
    it('classifies video codec families and ignores audio-only codecs', () => {
      expect(videoCodecFamilyOf('avc1.4d401f,mp4a.40.2')).toBe('avc1');
      expect(videoCodecFamilyOf('hvc1.1.6.L93.90')).toBe('hvc1');
      expect(videoCodecFamilyOf('hev1.1.6.L93.90')).toBe('hvc1');
      expect(videoCodecFamilyOf('mp4a.40.2')).toBeUndefined();
      expect(videoCodecFamilyOf(undefined)).toBeUndefined();
    });

    it('defaults to preferring avc1 over hvc1', () => {
      expect(getPreferredVideoCodecs(undefined)).toEqual(['avc1', 'hvc1']);
      expect(getPreferredVideoCodecs('')).toEqual(['avc1', 'hvc1']);
      // config can invert the preference
      expect(getPreferredVideoCodecs('hvc1,avc1')).toEqual(['hvc1', 'avc1']);
      // unknown tokens are ignored, falling back to default
      expect(getPreferredVideoCodecs('vp9')).toEqual(['avc1', 'hvc1']);
    });
  });

  describe('multicodec source is filtered to the preferred family', () => {
    let vod: Vod;

    beforeEach(async () => {
      vod = new HLSVod('http://mock.example/master.m3u8');
      // Default preference (avc1 > hvc1): after filtering only the avc1 variant
      // remains at bw 2000000, so the media fetch for that bandwidth must serve
      // the AVC playlist.
      await vod.load(
        createCodecFilteringMasterLoader(fixtureStream('master.m3u8')),
        mediaLoaderFor({ '2000000': 'avc_720p.m3u8' })
      );
    });

    it('advertises ONLY the preferred (avc1) profile at the colliding bandwidth', () => {
      const profiles = vod.getUsageProfiles();
      const collidingProfiles = profiles.filter(
        (p) => String(p.bw) === '2000000'
      );
      // Previously BOTH codecs were advertised; after filtering only avc remains.
      expect(collidingProfiles.length).toBe(1);
      expect(codecFamily(collidingProfiles[0].codecs || '')).toBe('avc');
    });

    it('still collapses to a single bandwidth, but now consistently', () => {
      expect(vod.getBandwidths()).toEqual(['2000000']);
    });

    it('advertised CODECS matches served-segment codec for EVERY variant', () => {
      const profiles = vod.getUsageProfiles();
      const served = servedFamilyByBandwidth(vod);

      // Served segments are AVC (the preferred, surviving family).
      expect(served['2000000']).toBe('avc');

      const mismatches = profiles.filter((p) => {
        const s = served[String(p.bw)];
        return s && codecFamily(p.codecs || '') !== s;
      });
      // FIXED behavior: zero mismatches (was `toBeGreaterThan(0)` in #63).
      expect(mismatches.length).toBe(0);
    });
  });

  describe('config can invert the preference to hvc1', () => {
    it('keeps only the hvc1 variant and serves HEVC segments', async () => {
      const vod: Vod = new HLSVod('http://mock.example/master.m3u8');
      await vod.load(
        createCodecFilteringMasterLoader(fixtureStream('master.m3u8'), [
          'hvc1',
          'avc1'
        ]),
        mediaLoaderFor({ '2000000': 'hevc_720p.m3u8' })
      );

      const profiles = vod.getUsageProfiles();
      const collidingProfiles = profiles.filter(
        (p) => String(p.bw) === '2000000'
      );
      expect(collidingProfiles.length).toBe(1);
      expect(codecFamily(collidingProfiles[0].codecs || '')).toBe('hevc');

      const served = servedFamilyByBandwidth(vod);
      expect(served['2000000']).toBe('hevc');
      const mismatches = profiles.filter((p) => {
        const s = served[String(p.bw)];
        return s && codecFamily(p.codecs || '') !== s;
      });
      expect(mismatches.length).toBe(0);
    });
  });

  describe('single-codec source is UNAFFECTED (passes through unchanged)', () => {
    it('does not drop any variant from an AVC-only master', async () => {
      const vod: Vod = new HLSVod('http://mock.example/master.m3u8');
      await vod.load(
        createCodecFilteringMasterLoader(fixtureStream('master_avc_only.m3u8')),
        mediaLoaderFor({
          '2000000': 'avc_720p.m3u8',
          '4000000': 'avc_1080p.m3u8'
        })
      );

      const profiles = vod.getUsageProfiles();
      // Both AVC variants survive.
      expect(profiles.map((p) => String(p.bw)).sort()).toEqual([
        '2000000',
        '4000000'
      ]);
      profiles.forEach((p) => expect(codecFamily(p.codecs || '')).toBe('avc'));

      const served = servedFamilyByBandwidth(vod);
      const mismatches = profiles.filter((p) => {
        const s = served[String(p.bw)];
        return s && codecFamily(p.codecs || '') !== s;
      });
      expect(mismatches.length).toBe(0);
    });

    it('leaves a single-codec parsed master byte-for-byte (no StreamItem removed)', () => {
      // Directly exercise the filter: a single-family master returns undefined
      // (no filtering applied) and keeps every StreamItem.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m3u8 = require('@eyevinn/m3u8');
      return new Promise<void>((resolve, reject) => {
        const parser = m3u8.createStream();
        parser.on('m3u', (m3u: any) => {
          const before = m3u.items.StreamItem.length;
          const chosen = filterMasterManifestByCodec(m3u);
          expect(chosen).toBeUndefined();
          expect(m3u.items.StreamItem.length).toBe(before);
          resolve();
        });
        parser.on('error', reject);
        fs.createReadStream(
          path.join(FIXTURE_DIR, 'master_avc_only.m3u8')
        ).pipe(parser);
      });
    });
  });

  describe('preferred family absent → graceful fallback', () => {
    it('keeps the source first-seen family instead of emptying the master', async () => {
      // Source is HEVC+AV1 (no avc1). Default preference (avc1 first) is absent,
      // so the filter must fall back to the source's first-seen family (hvc1).
      const vod: Vod = new HLSVod('http://mock.example/master.m3u8');
      await vod.load(
        createCodecFilteringMasterLoader(fixtureStream('master_no_avc.m3u8')),
        mediaLoaderFor({ '2000000': 'hevc_720p.m3u8' })
      );

      const profiles = vod.getUsageProfiles();
      // Master is not emptied; the hvc1 variant survives.
      expect(profiles.length).toBeGreaterThan(0);
      const collidingProfiles = profiles.filter(
        (p) => String(p.bw) === '2000000'
      );
      expect(collidingProfiles.length).toBe(1);
      expect(codecFamily(collidingProfiles[0].codecs || '')).toBe('hevc');

      const served = servedFamilyByBandwidth(vod);
      const mismatches = profiles.filter((p) => {
        const s = served[String(p.bw)];
        return s && codecFamily(p.codecs || '') !== s;
      });
      expect(mismatches.length).toBe(0);
    });
  });
});
