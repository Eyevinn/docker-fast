import {
  IAssetManager,
  IChannelManager,
  IStreamSwitchManager
} from 'eyevinn-channel-engine';

export interface PluginInterface {
  newAssetManager: () => IAssetManager;
  newChannelManager: (
    useDemuxedAudio?: boolean,
    useVTTSubtitles?: boolean
  ) => IChannelManager;
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

export interface Language {
  language: string;
  name: string;
  default: boolean;
}
