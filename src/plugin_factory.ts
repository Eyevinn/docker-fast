import { DemoPlugin } from "./plugins/plugin_demo";
import { PluginInterface } from "./plugins/plugin_interface";

export class PluginFactory {
  private availablePlugins: Map<string, PluginInterface>;

  constructor() {
    this.availablePlugins = new Map<string, PluginInterface>();
    this.availablePlugins.set("demo", new DemoPlugin("demo"));
  }

  create(pluginName: string): PluginInterface {
    if (this.availablePlugins.has(pluginName)) {
      return this.availablePlugins.get(pluginName);
    } else {
      throw new Error(`No plugin with name "${pluginName}" available`);
    }
  }
}