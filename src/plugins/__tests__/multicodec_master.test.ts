/**
 * Regression test for docker-fast#65 (fix for the repro landed in #63).
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
 * The fix (#65) filters the source master to a single codec family INSIDE
 * docker-fast — via `filterMasterByCodecPreference` — before the master reaches
 * `@eyevinn/hls-vodtolive`. Once filtered, bandwidth buckets never mix codecs,
 * so every advertised CODECS matches the codec of the segments served at that
 * bandwidth. This test asserts that fixed behavior, and also verifies that a
 * single-codec master is passed through unchanged.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { filterMasterByCodecPreference } from '../utils';

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

function readFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf-8');
}

type Vod = {
  load: (
    m: () => unknown,
    mm: (bw?: string | number) => unknown
  ) => Promise<void>;
  getUsageProfiles: () => UsageProfile[];
  getBandwidths: () => string[];
  getMediaSegments: () => { [bw: string]: Segment[] };
};

// Load a VOD from the given (already codec-filtered) master text. After
// filtering only one codec family remains, so the media loader returns that
// family's playlist — mirroring how docker-fast serves the real source
// segments. @eyevinn/hls-vodtolive calls the injected media loader with the
// variant bandwidth only, so `expectedFamily` disambiguates the colliding bw.
async function loadVodFromMaster(
  masterText: string,
  expectedFamily: 'avc' | 'hevc'
): Promise<Vod> {
  const vod = new HLSVod('http://mock.example/master.m3u8') as Vod;
  const masterLoader = () => Readable.from([masterText]);
  const mediaLoader = () => {
    const name = expectedFamily === 'hevc' ? 'hevc_720p.m3u8' : 'avc_720p.m3u8';
    return fs.createReadStream(path.join(FIXTURE_DIR, name));
  };
  await vod.load(masterLoader, mediaLoader);
  return vod;
}

describe('multicodec HEVC+AVC master manifest (docker-fast#65 fix)', () => {
  it('keeps only avc1 variants when avc1 is preferred', async () => {
    const master = filterMasterByCodecPreference(
      readFixture('master.m3u8'),
      'avc1'
    );
    const vod = await loadVodFromMaster(master, 'avc');

    const profiles = vod.getUsageProfiles();
    // Only the AVC variant survives the filter at the colliding bandwidth.
    expect(profiles.length).toBe(1);
    expect(codecFamily(profiles[0].codecs || '')).toBe('avc');
  });

  it('keeps only hvc1 variants when hvc1 is preferred', async () => {
    const master = filterMasterByCodecPreference(
      readFixture('master.m3u8'),
      'hvc1'
    );
    const vod = await loadVodFromMaster(master, 'hevc');

    const profiles = vod.getUsageProfiles();
    expect(profiles.length).toBe(1);
    expect(codecFamily(profiles[0].codecs || '')).toBe('hevc');
  });

  it('FIXED: every advertised CODECS matches the served-segment codec', async () => {
    // Filter to a single family so bandwidth buckets never mix codecs.
    const master = filterMasterByCodecPreference(
      readFixture('master.m3u8'),
      'avc1'
    );
    const vod = await loadVodFromMaster(master, 'avc');

    const profiles = vod.getUsageProfiles();
    const segments = vod.getMediaSegments();

    const servedFamilyByBw: { [bw: string]: 'avc' | 'hevc' | 'unknown' } = {};
    Object.keys(segments).forEach((bw) => {
      const firstSeg = segments[bw].find((s) => s.uri);
      servedFamilyByBw[bw] = firstSeg
        ? segmentFamily(firstSeg.uri as string)
        : 'unknown';
    });

    // At the colliding bandwidth the engine now serves AVC segments, matching
    // the single advertised AVC profile.
    expect(servedFamilyByBw['2000000']).toBe('avc');

    const mismatches = profiles.filter((p) => {
      const served = servedFamilyByBw[String(p.bw)];
      return served && codecFamily(p.codecs || '') !== served;
    });

    // The whole point of #65: no advertised codec points at wrong-codec segments.
    expect(mismatches.length).toBe(0);
  });

  it('leaves a single-codec master unchanged (no preference set)', () => {
    const original = readFixture('avc_720p.m3u8');
    // No preference => passthrough, even for a would-be multicodec master.
    expect(filterMasterByCodecPreference(readFixture('master.m3u8'))).toBe(
      readFixture('master.m3u8')
    );
    // A single-family master is untouched even when a preference is set.
    const singleFamilyMaster = [
      '#EXTM3U',
      '#EXT-X-VERSION:6',
      '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720,CODECS="avc1.4d401f"',
      'avc_720p.m3u8'
    ].join('\n');
    expect(filterMasterByCodecPreference(singleFamilyMaster, 'avc1')).toBe(
      singleFamilyMaster
    );
    // Guard against the fixture read being empty.
    expect(original.length).toBeGreaterThan(0);
  });
});
