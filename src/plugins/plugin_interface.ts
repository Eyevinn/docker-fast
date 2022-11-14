export interface PluginInterface {
  newAssetManager: () => any; // to be fixed
  newChannelManager: () => any; // to be fixed
}

export class BasePlugin {
  protected pluginName: string;

  constructor(name: string) {
    this.pluginName = name;
  }
}