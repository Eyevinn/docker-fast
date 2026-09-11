/**
 * Tests for the SSRF guard on the codec-filter source URL (docker-fast#65
 * review follow-up).
 *
 * The `/codecfilter/master.m3u8?src=<url>` endpoint fetches an attacker-supplied
 * URL. `validateSourceUrl` is the gate that runs BEFORE any fetch: it accepts
 * only public http/https URLs and rejects anything resolving to a
 * private/loopback/link-local/metadata range, pinning the connection to the
 * validated IP to defeat DNS rebinding. These tests exercise that gate with a
 * mocked DNS resolver so no real network lookups happen.
 */
import { validateSourceUrl, UnsafeSourceUrlError } from '../utils';
import type { LookupAddress } from 'dns';

type MockLookup = (
  hostname: string,
  options: { all: true }
) => Promise<LookupAddress[]>;

// A lookup stub that always resolves the hostname to the given addresses.
function lookupReturning(addresses: LookupAddress[]): MockLookup {
  return async () => addresses;
}

describe('validateSourceUrl (docker-fast#65 SSRF guard)', () => {
  it('accepts a normal public https URL', async () => {
    const lookup = lookupReturning([{ address: '93.184.216.34', family: 4 }]);
    const result = await validateSourceUrl(
      'https://example.com/master.m3u8',
      lookup as never
    );
    expect(result.url.hostname).toBe('example.com');
    expect(typeof result.agent).toBe('function');
    // The pinning agent should build an https agent for an https URL.
    const agent = result.agent(new URL('https://example.com/master.m3u8'));
    expect(agent).toBeDefined();
  });

  it('accepts a normal public http URL', async () => {
    const lookup = lookupReturning([{ address: '93.184.216.34', family: 4 }]);
    const result = await validateSourceUrl(
      'http://cdn.example.net/a/master.m3u8',
      lookup as never
    );
    expect(result.url.protocol).toBe('http:');
  });

  it.each([
    'file:///etc/passwd',
    'gopher://host/1',
    'ftp://host/x',
    'data:text/plain,hi'
  ])('rejects non-http(s) scheme %s', async (src) => {
    await expect(validateSourceUrl(src)).rejects.toBeInstanceOf(
      UnsafeSourceUrlError
    );
  });

  it('rejects a malformed URL', async () => {
    await expect(validateSourceUrl('not a url')).rejects.toBeInstanceOf(
      UnsafeSourceUrlError
    );
  });

  it.each([
    'http://127.0.0.1/master.m3u8',
    'http://169.254.169.254/latest/meta-data/',
    'http://10.0.0.5/master.m3u8',
    'http://192.168.1.10/master.m3u8',
    'http://172.16.0.1/master.m3u8',
    'http://0.0.0.0/master.m3u8',
    'http://[::1]/master.m3u8'
  ])('rejects literal private/loopback/metadata address %s', async (src) => {
    await expect(validateSourceUrl(src)).rejects.toBeInstanceOf(
      UnsafeSourceUrlError
    );
  });

  it('rejects an IPv4-mapped IPv6 literal for a private address', async () => {
    await expect(
      validateSourceUrl('http://[::ffff:127.0.0.1]/master.m3u8')
    ).rejects.toBeInstanceOf(UnsafeSourceUrlError);
  });

  it('rejects a hostname that resolves to a private IP (DNS rebinding)', async () => {
    const lookup = lookupReturning([{ address: '10.1.2.3', family: 4 }]);
    await expect(
      validateSourceUrl(
        'http://sneaky.example.com/master.m3u8',
        lookup as never
      )
    ).rejects.toBeInstanceOf(UnsafeSourceUrlError);
  });

  it('rejects when ANY resolved address is private, even if one is public', async () => {
    const lookup = lookupReturning([
      { address: '93.184.216.34', family: 4 },
      { address: '169.254.169.254', family: 4 }
    ]);
    await expect(
      validateSourceUrl('http://mixed.example.com/master.m3u8', lookup as never)
    ).rejects.toBeInstanceOf(UnsafeSourceUrlError);
  });

  it('rejects a hostname that resolves to an IPv6 link-local address', async () => {
    const lookup = lookupReturning([{ address: 'fe80::1', family: 6 }]);
    await expect(
      validateSourceUrl('http://v6.example.com/master.m3u8', lookup as never)
    ).rejects.toBeInstanceOf(UnsafeSourceUrlError);
  });

  it('rejects when the hostname resolves to nothing', async () => {
    const lookup = lookupReturning([]);
    await expect(
      validateSourceUrl('http://void.example.com/master.m3u8', lookup as never)
    ).rejects.toBeInstanceOf(UnsafeSourceUrlError);
  });

  it('carries an HTTP status code on the error', async () => {
    const lookup = lookupReturning([{ address: '10.0.0.1', family: 4 }]);
    try {
      await validateSourceUrl('http://x.example.com/m.m3u8', lookup as never);
      fail('expected rejection');
    } catch (err) {
      expect(err).toBeInstanceOf(UnsafeSourceUrlError);
      expect((err as UnsafeSourceUrlError).statusCode).toBeGreaterThanOrEqual(
        400
      );
    }
  });
});
