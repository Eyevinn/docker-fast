import { IAssetManager, IChannelManager, IStreamSwitchManager } from "eyevinn-channel-engine";

export interface PluginInterface {
  newAssetManager: () => IAssetManager; 
  newChannelManager: () => IChannelManager;
  newStreamSwitchManager: () => IStreamSwitchManager;
}

export class BasePlugin {
  protected pluginName: string;

  constructor(name: string) {
    this.pluginName = name;
  }

  getPluginName(): string {
    return this.pluginName;
  }
}