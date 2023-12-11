import { WebHookPlugin } from './plugin_webhook';
import fetchMock from 'jest-fetch-mock';

describe('webhook plugin', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('provides channel id only once on multiple requests', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        hlsUrl: 'https://vod.dummy/foo.m3u8',
        id: 'dummy',
        title: 'dummytitle'
      })
    );

    const plugin = new WebHookPlugin();
    const assetManager = plugin.newAssetManager();
    const nextVod = await assetManager.getNextVod({
      sessionId: 'dummy',
      playlistId: 'test'
    });
    expect(nextVod.uri).toEqual('https://vod.dummy/foo.m3u8');
    expect(nextVod.id).toEqual('dummy');
    expect(nextVod.title).toEqual('dummytitle');

    await assetManager.getNextVod({ sessionId: 'dummy', playlistId: 'test' });

    expect(fetchMock.mock.calls[0][0]).toEqual(
      'http://localhost:8002/nextVod?channelId=test'
    );
    expect(fetchMock.mock.calls[1][0]).toEqual(
      'http://localhost:8002/nextVod?channelId=test'
    );
  });

  test('provides apikey on http request when enabled', async () => {
    process.env.OPTS_WEBHOOK_APIKEY = 'myapikey';

    fetchMock.mockResponse(
      JSON.stringify({
        hlsUrl: 'https://vod.dummy/foo.m3u8',
        id: 'dummy',
        title: 'dummytitle'
      })
    );

    const plugin = new WebHookPlugin();
    const assetManager = plugin.newAssetManager();
    await assetManager.getNextVod({
      sessionId: 'dummy',
      playlistId: 'test'
    });
    expect(fetchMock.mock.calls[0][1]?.headers).toBeDefined();
    if (fetchMock.mock.calls[0][1]?.headers) {
      expect(fetchMock.mock.calls[0][1].headers['Authorization']).toEqual(
        'Bearer myapikey'
      );
    }
  });

  test('does not provides apikey on http request if not enabled', async () => {
    process.env.OPTS_WEBHOOK_APIKEY = undefined;

    fetchMock.mockResponse(
      JSON.stringify({
        hlsUrl: 'https://vod.dummy/foo.m3u8',
        id: 'dummy',
        title: 'dummytitle'
      })
    );

    const plugin = new WebHookPlugin();
    const assetManager = plugin.newAssetManager();
    await assetManager.getNextVod({
      sessionId: 'dummy',
      playlistId: 'test'
    });
    if (fetchMock.mock.calls[0][1]?.headers) {
      expect(
        fetchMock.mock.calls[0][1].headers['Authorization']
      ).toBeUndefined();
    }
  });
});
