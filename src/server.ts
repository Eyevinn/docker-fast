import { ChannelEngine } from 'eyevinn-channel-engine';
import { PluginFactory } from './plugin_factory';

import FinalHandler from 'finalhandler';
import ServeStatic from 'serve-static';
import http from 'http';

const serve = ServeStatic('./dist/ui');
const server = http.createServer((req, res) => {
  serve(req, res, FinalHandler(req, res));
});
server.listen(process.env.UI_PORT || 8001);

function isTrue(s: string): boolean {
  const regex = /^\s*(true|1)\s*$/i;
  return regex.test(s);
}

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
const heartbeat = process.env.OPTS_HEARTBEAT_URL
  ? process.env.OPTS_HEARTBEAT_URL
  : '/';
const vttBasePath = process.env.OPTS_VTT_BASE_PATH
  ? process.env.OPTS_VTT_BASE_PATH
  : `/vtt`;

const engine = new ChannelEngine(plugin.newAssetManager(), {
  heartbeat,
  defaultSlateUri,
  useDemuxedAudio,
  useVTTSubtitles,
  vttBasePath,
  alwaysNewSegments: true,
  channelManager: plugin.newChannelManager(useDemuxedAudio, useVTTSubtitles),
  streamSwitchManager: plugin.newStreamSwitchManager()
});
engine.start();
engine.listen(process.env.PORT || 8000);
