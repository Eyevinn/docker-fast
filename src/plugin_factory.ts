import { DemoPlugin } from "./plugins/plugin_demo";
import { PluginInterface } from "./plugins/plugin_interface";
import { ScheduleServicePlugin } from "./plugins/plugin_schedule_service";

function create<T extends PluginInterface>(c: { new(): T }): T {
  return new c();  
}

export function PluginFactory(pluginName: string) {
  switch(pluginName) {
    case 'Demo':
      return create(DemoPlugin);
    case 'ScheduleService':
      return create(ScheduleServicePlugin);
    default:
      throw new Error(`Plugin ${pluginName} is not available`);
  }
}