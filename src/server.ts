import { ChannelEngine } from 'eyevinn-channel-engine';
import { PluginFactory } from './plugin_factory';

function isTrue(s: string): boolean {
  const regex = /^\s*(true|1)\s*$/i;
  return regex.test(s);
}

const pluginName = process.env.FAST_PLUGIN || "Demo";
const plugin = PluginFactory(pluginName);

const useDemuxedAudio =
  process.env.OPTS_USE_DEMUXED_AUDIO ? isTrue(process.env.OPTS_USE_DEMUXED_AUDIO) : true;
const defaultSlateUri =
  process.env.OPTS_DEFAULT_SLATE_URI ? process.env.OPTS_DEFAULT_SLATE_URI
  : 'https://lab.cdn.eyevinn.technology/sto-slate.mp4/manifest.m3u8';
const heartbeat =
  process.env.OPTS_HEARTBEAT_URL ? process.env.OPTS_HEARTBEAT_URL : '/';

const engine = new ChannelEngine(plugin.newAssetManager(), {
  heartbeat,
  defaultSlateUri,
  useDemuxedAudio,
  channelManager: plugin.newChannelManager(),
  streamSwitchManager: plugin.newStreamSwitchManager(),
});
engine.start();
engine.listen(process.env.PORT || 8000);