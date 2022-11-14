import ChannelEngine from 'eyevinn-channel-engine';
import { PluginFactory } from './plugin_factory';

const pluginName = process.env.FAST_PLUGIN || "demo";

const factory = new PluginFactory();
const plugin = factory.create(pluginName);

const engine = new ChannelEngine(plugin.newAssetManager(), {
  heartbeat: '/',
  channelManager: plugin.newChannelManager(),
});
engine.start();
engine.listen(process.env.PORT || 8000);