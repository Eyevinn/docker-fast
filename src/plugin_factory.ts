import { DemoPlugin } from './plugins/plugin_demo';
import { PluginInterface } from './plugins/interface';
import { ScheduleServicePlugin } from './plugins/plugin_schedule_service';
import { LoopPlugin } from './plugins/plugin_loop';
import { PlaylistPlugin } from './plugins/plugin_playlist';
import { BarkerPlugin } from './plugins/plugin_barker';
import { WebHookPlugin } from './plugins/plugin_webhook';

function create<T extends PluginInterface>(c: { new (): T }): T {
  return new c();
}

export function PluginFactory(pluginName: string) {
  switch (pluginName) {
    case 'Demo':
      return create(DemoPlugin);
    case 'ScheduleService':
      return create(ScheduleServicePlugin);
    case 'Loop':
      return create(LoopPlugin);
    case 'Playlist':
      return create(PlaylistPlugin);
    case 'Barker':
      return create(BarkerPlugin);
    case 'WebHook':
      return create(WebHookPlugin);
    default:
      throw new Error(`Plugin ${pluginName} is not available`);
  }
}
