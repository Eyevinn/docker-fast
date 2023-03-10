import { IAssetManager, IChannelManager, 
  VodRequest, VodResponse, 
  Channel, ChannelProfile, IStreamSwitchManager 
} from "eyevinn-channel-engine";

import { BasePlugin, PluginInterface } from "./interface";
import { getDefaultChannelAudioProfile, getDefaultChannelVideoProfile } from "./utils";

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
  private useDemuxedAudio: boolean;

  constructor(channelId: string, useDemuxedAudio: boolean) {
    this.channelId = channelId;
    this.useDemuxedAudio = useDemuxedAudio;
    console.log(`Loop channel available at /channels/${this.channelId}/master.m3u8`);
  }

  getChannels(): Channel[] {
    let channel: Channel = {
      id: this.channelId,
      profile: this._getProfile()
    };
    if (this.useDemuxedAudio) {
      channel.audioTracks = getDefaultChannelAudioProfile()
    }
    const channelList = [ channel ];
    return channelList;
  }

  _getProfile(): ChannelProfile[] {
    return getDefaultChannelVideoProfile();
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

  newChannelManager(useDemuxedAudio: boolean): IChannelManager {
    return new LoopChannelManager(process.env.LOOP_CHANNEL_NAME ? process.env.LOOP_CHANNEL_NAME : "loop", useDemuxedAudio);
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}