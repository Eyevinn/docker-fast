import { ChannelEngine } from 'eyevinn-channel-engine';
import { PluginFactory } from './plugin_factory';
import {
  absolutizeMasterVariants,
  CODEC_FILTER_PATH,
  filterMasterByCodecPreference,
  getCodecPreference,
  UnsafeSourceUrlError,
  validateSourceUrl
} from './plugins/utils';

import FinalHandler from 'finalhandler';
import ServeStatic from 'serve-static';
import http from 'http';
import fetch from 'node-fetch';

const serve = ServeStatic('./dist/ui');
const server = http.createServer(async (req, res) => {
  // Self-hosted codec-filtering master endpoint. Fetches an upstream HLS master,
  // keeps only the preferred codec family's variants, and rewrites variant URIs
  // to absolute so the engine still resolves them against the real origin.
  //
  // Only registered when a codec preference is configured; otherwise the request
  // falls through to the static handler (404). This shrinks the SSRF attack
  // surface to only when the feature is actually enabled.
  const preference = getCodecPreference();
  if (preference && req.url && req.url.split('?')[0] === CODEC_FILTER_PATH) {
    try {
      const query = new URL(req.url, 'http://localhost').searchParams;
      const src = query.get('src');
      if (!src) {
        res.statusCode = 400;
        res.end('Missing src parameter');
        return;
      }
      // Validate + pin the source before fetching to prevent read-SSRF: rejects
      // non-http(s) schemes and hosts resolving to private/loopback/link-local/
      // metadata ranges, and pins the connection to the validated IP (defeating
      // DNS rebinding).
      const { url, agent } = await validateSourceUrl(src);
      const upstream = await fetch(url.toString(), { agent });
      if (!upstream.ok) {
        res.statusCode = 502;
        res.end('Failed to fetch source master');
        return;
      }
      const master = await upstream.text();
      const filtered = absolutizeMasterVariants(
        filterMasterByCodecPreference(master, preference),
        src
      );
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.end(filtered);
    } catch (err) {
      if (err instanceof UnsafeSourceUrlError) {
        // Log detail server-side only; return a generic message so the endpoint
        // cannot be used as an SSRF oracle.
        console.error('Codec filter rejected source URL: ' + err.message);
        res.statusCode = err.statusCode;
        res.end('Source URL not permitted');
        return;
      }
      // Log the real error server-side; never echo it to the client.
      console.error('Codec filter error:', err);
      res.statusCode = 500;
      res.end('Codec filter error');
    }
    return;
  }
  serve(req, res, FinalHandler(req, res));
});
server.listen(process.env.UI_PORT || 8001);

function isTrue(s: string): boolean {
  const regex = /^\s*(true|1)\s*$/i;
  return regex.test(s);
}

try {
  const pluginName = process.env.FAST_PLUGIN || 'Demo';
  const plugin = PluginFactory(pluginName);

  const useDemuxedAudio = process.env.OPTS_USE_DEMUXED_AUDIO
    ? isTrue(process.env.OPTS_USE_DEMUXED_AUDIO)
    : true;
  const useVTTSubtitles = process.env.OPTS_USE_VTT_SUBTITLES
    ? isTrue(process.env.OPTS_USE_VTT_SUBTITLES)
    : true;
  const defaultSlateUri = process.env.OPTS_DEFAULT_SLATE_URI
    ? process.env.OPTS_DEFAULT_SLATE_URI
    : 'https://lab.cdn.eyevinn.technology/sto-slate.mp4/manifest.m3u8';
  const slateDuration = process.env.OPTS_SLATE_DURATION_MS
    ? parseInt(process.env.OPTS_SLATE_DURATION_MS)
    : 4000;
  const slateRepetitions = process.env.OPTS_SLATE_REPETITIONS
    ? parseInt(process.env.OPTS_SLATE_REPETITIONS)
    : 10;
  const heartbeat = process.env.OPTS_HEARTBEAT_URL
    ? process.env.OPTS_HEARTBEAT_URL
    : '/';
  const vttBasePath = process.env.OPTS_VTT_BASE_PATH
    ? process.env.OPTS_VTT_BASE_PATH
    : `/vtt`;

  const engine = new ChannelEngine(plugin.newAssetManager(), {
    heartbeat,
    defaultSlateUri,
    slateDuration,
    slateRepetitions,
    useDemuxedAudio,
    useVTTSubtitles,
    vttBasePath,
    alwaysNewSegments: true,
    channelManager: plugin.newChannelManager(useDemuxedAudio, useVTTSubtitles),
    streamSwitchManager: plugin.newStreamSwitchManager()
  });
  engine.start();
  engine.listen(process.env.PORT || 8000);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
