import { IAssetManager, IChannelManager } from "eyevinn-channel-engine";

export interface PluginInterface {
  newAssetManager: () => IAssetManager; // to be fixed
  newChannelManager: () => IChannelManager; // to be fixed
}

export class BasePlugin {
  protected pluginName: string;

  constructor(name: string) {
    this.pluginName = name;
  }
}