import { WebHookPlugin } from './plugin_webhook';
import fetchMock from 'jest-fetch-mock';

describe('webhook plugin', () => {
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
});
