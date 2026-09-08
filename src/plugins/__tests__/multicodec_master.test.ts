/**
 * Characterization test for docker-fast#36 (repro ticket #63).
 *
 * Reported bug: an HLS master containing BOTH HEVC (hvc1) and AVC (avc1)
 * variants makes the engine advertise one codec in the master manifest CODECS
 * attribute while the segments actually delivered at that bandwidth are the
 * other codec. The reported trigger is two variants sharing the SAME BANDWIDTH.
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
 * IMPORTANT: this test asserts the CURRENT (buggy) behavior so it PASSES today
 * and keeps CI green. It documents the mismatch (advertised codec != served
 * segment codec). The fix ticket (#65) will FLIP these assertions to require
 * that every advertised CODECS matches the codec of the segments served at that
 * bandwidth. Do not "fix" this test in isolation — update it as part of #65.
 */
import * as fs from 'fs';
import * as path from 'path';

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

describe('multicodec HEVC+AVC master manifest (docker-fast#36 repro)', () => {
  const masterManifest = () =>
    fs.createReadStream(path.join(FIXTURE_DIR, 'master.m3u8'));

  // The engine loads variant media playlists keyed by bandwidth only. Because
  // the two variants collide on bandwidth (2000000), this fetcher is called
  // twice with the same key and can only return one of the two playlists per
  // bandwidth — which is the crux of the bug.
  const mediaManifest = (bandwidth: string | number) => {
    const fname: { [bw: string]: string } = {
      '2000000': 'hevc_720p.m3u8'
    };
    return fs.createReadStream(
      path.join(FIXTURE_DIR, fname[String(bandwidth)] || 'hevc_720p.m3u8')
    );
  };

  let vod: {
    load: (
      m: () => unknown,
      mm: (bw: string | number) => unknown
    ) => Promise<void>;
    getUsageProfiles: () => UsageProfile[];
    getBandwidths: () => string[];
    getMediaSegments: () => { [bw: string]: Segment[] };
  };

  beforeEach(async () => {
    vod = new HLSVod('http://mock.example/master.m3u8');
    await vod.load(masterManifest, mediaManifest);
  });

  it('advertises BOTH avc1 and hvc1 profiles at the colliding bandwidth', () => {
    const profiles = vod.getUsageProfiles();
    const collidingProfiles = profiles.filter(
      (p) => String(p.bw) === '2000000'
    );

    // The master manifest the engine emits gets one STREAM-INF per usage
    // profile, so both codecs are advertised at bandwidth 2000000.
    expect(collidingProfiles.length).toBe(2);
    const advertisedCodecs = collidingProfiles
      .map((p) => codecFamily(p.codecs || ''))
      .sort();
    expect(advertisedCodecs).toEqual(['avc', 'hevc']);
  });

  it('collapses the colliding bandwidth to a single served segment set', () => {
    const bandwidths = vod.getBandwidths();
    // Two variants, but only one bandwidth key survives.
    expect(bandwidths).toEqual(['2000000']);
  });

  it('BUG: advertised CODECS at a bandwidth do not all match the served-segment codec', () => {
    const profiles = vod.getUsageProfiles();
    const segments = vod.getMediaSegments();

    // Determine the codec of the segments actually served per bandwidth by
    // inspecting the media segment URIs the engine would deliver for master<bw>.m3u8.
    const servedFamilyByBw: { [bw: string]: 'avc' | 'hevc' | 'unknown' } = {};
    Object.keys(segments).forEach((bw) => {
      const firstSeg = segments[bw].find((s) => s.uri);
      servedFamilyByBw[bw] = firstSeg
        ? segmentFamily(firstSeg.uri as string)
        : 'unknown';
    });

    // At the colliding bandwidth the engine serves exactly one codec's segments.
    expect(servedFamilyByBw['2000000']).toBe('hevc');

    // For each advertised profile, does the advertised codec match what is served?
    const mismatches = profiles.filter((p) => {
      const served = servedFamilyByBw[String(p.bw)];
      return served && codecFamily(p.codecs || '') !== served;
    });

    // CURRENT BUGGY BEHAVIOR: the avc1 profile is advertised at bw 2000000 but
    // the segments served there are HEVC — a genuine mismatch. This assertion
    // documents docker-fast#36 and is expected to become `toBe(0)` once #65
    // makes codec selection honor per-variant codecs.
    expect(mismatches.length).toBeGreaterThan(0);
    const mismatched = mismatches[0];
    expect(codecFamily(mismatched.codecs || '')).toBe('avc');
    expect(servedFamilyByBw[String(mismatched.bw)]).toBe('hevc');
  });
});
