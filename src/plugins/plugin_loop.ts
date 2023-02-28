import { IAssetManager, IChannelManager, 
  VodRequest, VodResponse, 
  Channel, ChannelProfile, IStreamSwitchManager 
} from "eyevinn-channel-engine";

import { BasePlugin, PluginInterface } from "./plugin_interface";

class LoopAssetManager implements IAssetManager {
  private vodToLoop: URL;

  constructor(vodToLoop: URL) {
    this.vodToLoop = vodToLoop;
  }

  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    const vodResponse = {
      id: "loop",
      title: "VOD on Loop",
      uri: this.vodToLoop.toString(),
    };
    return vodResponse;
  }
}

class LoopChannelManager implements IChannelManager {
  private channelId: string;

  constructor(channelId: string) {
    this.channelId = channelId;
    console.log(`Loop channel available at /channels/${this.channelId}/master.m3u8`);
  }

  getChannels(): Channel[] {
    const channelList = [
      {
        id: this.channelId,
        profile: this._getProfile()
      }
    ];
    return channelList;
  }

  _getProfile(): ChannelProfile[] {
    return [
      { bw: 8134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1920, 1280] },
      { bw: 6134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1280, 720] },
      { bw: 4134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1024, 458] },
      { bw: 2323000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [640, 286] },
      { bw: 1313000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [480, 214] },
    ];
  }
}

export class LoopPlugin extends BasePlugin implements PluginInterface  {
  constructor() {
    super('Loop');
  }
  
  newAssetManager(): IAssetManager {
    const vodToLoop = process.env.LOOP_VOD_URL ? new URL(process.env.LOOP_VOD_URL) 
      : new URL("https://lab.cdn.eyevinn.technology/eyevinn-reel-feb-2023-_2Y7i4eOAi.mp4/manifest.m3u8");
    return new LoopAssetManager(vodToLoop);
  }

  newChannelManager(): IChannelManager {
    return new LoopChannelManager(process.env.LOOP_CHANNEL_NAME ? process.env.LOOP_CHANNEL_NAME : "loop");
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}