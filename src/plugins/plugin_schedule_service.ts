import { BasePlugin, PluginInterface } from "./plugin_interface";
import { IAssetManager, IChannelManager, IStreamSwitchManager, Schedule, VodRequest, VodResponse } from "eyevinn-channel-engine";
import * as Adapter from '@eyevinn/schedule-service-adapter';

class AdapterAssetManager implements IAssetManager {
  private adapterAssetManager: Adapter.AssetManager;
  
  constructor(adapterChannelManager: Adapter.ChannelManager) {
    this.adapterAssetManager = new Adapter.AssetManager({ 
      channelManager: adapterChannelManager,
    });
  }

  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    return await this.adapterAssetManager.getNextVod({ playlistId: vodRequest.playlistId });
  }

  handleError(err: string, vodResponse: VodResponse) {
    return this.adapterAssetManager.handleError(err, vodResponse);
  }
}

class AdapterStreamSwitchManager implements IStreamSwitchManager {
  private adapterStreamSwitchManager: Adapter.StreamSwitchManager;

  constructor(adapterChannelManager: Adapter.ChannelManager) {
    this.adapterStreamSwitchManager = new Adapter.StreamSwitchManager({
      channelManager: adapterChannelManager,
    });
  }

  getSchedule(channelId: string): Promise<Schedule[]> {
    return new Promise((resolve, reject) => {
      this.adapterStreamSwitchManager.getSchedule(channelId)
      .then((s: Schedule[]) => {
        resolve(s);
      })
      .catch(reject);
    });
  }
}

export class ScheduleServicePlugin extends BasePlugin implements PluginInterface  {
  private adapterChannelManager: Adapter.ChannelManager;

  constructor() {
    super('ScheduleService');
    const endpointUrl = 
      new URL(process.env.SCHEDULE_SERVICE_API_URL || 'https://schedule.vc.eyevinn.technology/api/v1');
    this.adapterChannelManager = new Adapter.ChannelManager({
      scheduleServiceEndpoint: endpointUrl,
    });
  }

  newAssetManager(): IAssetManager {
    return new AdapterAssetManager(this.adapterChannelManager);
  }

  newChannelManager(): IChannelManager {
    return this.adapterChannelManager;
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return new AdapterStreamSwitchManager(this.adapterChannelManager);
  };
}