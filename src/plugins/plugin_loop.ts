import {
  IAssetManager,
  IChannelManager,
  VodRequest,
  VodResponse,
  Channel,
  ChannelProfile,
  IStreamSwitchManager
} from 'eyevinn-channel-engine';

import { BasePlugin, PluginInterface } from './interface';
import {
  getDefaultChannelAudioProfile,
  getDefaultChannelVideoProfile,
  getDefaultChannelSubtitleProfile
} from './utils';

class LoopAssetManager implements IAssetManager {
  private vodToLoop: URL;

  constructor(vodToLoop: URL) {
    this.vodToLoop = vodToLoop;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    const vodResponse = {
      id: 'loop',
      title: 'VOD on Loop',
      uri: this.vodToLoop.toString()
    };
    return vodResponse;
  }
}

class LoopChannelManager implements IChannelManager {
  private channelId: string;
  private useDemuxedAudio: boolean;
  private useVTTSubtitles: boolean;

  constructor(
    channelId: string,
    useDemuxedAudio: boolean,
    useVTTSubtitles: boolean
  ) {
    this.channelId = channelId;
    this.useDemuxedAudio = useDemuxedAudio;
    this.useVTTSubtitles = useVTTSubtitles;
    console.log(
      `Loop channel available at /channels/${this.channelId}/master.m3u8`
    );
  }

  getChannels(): Channel[] {
    const channel: Channel = {
      id: this.channelId,
      profile: this._getProfile()
    };
    if (this.useDemuxedAudio) {
      channel.audioTracks = getDefaultChannelAudioProfile();
    }
    if (this.useVTTSubtitles) {
      channel.subtitleTracks = getDefaultChannelSubtitleProfile();
    }
    const channelList = [channel];
    return channelList;
  }

  _getProfile(): ChannelProfile[] {
    return getDefaultChannelVideoProfile();
  }
}

export class LoopPlugin extends BasePlugin implements PluginInterface {
  constructor() {
    super('Loop');
  }

  newAssetManager(): IAssetManager {
    const vodToLoop = process.env.LOOP_VOD_URL
      ? new URL(process.env.LOOP_VOD_URL)
      : new URL(
          'https://lab.cdn.eyevinn.technology/eyevinn-reel-feb-2023-_2Y7i4eOAi.mp4/manifest.m3u8'
        );
    return new LoopAssetManager(vodToLoop);
  }

  newChannelManager(
    useDemuxedAudio: boolean,
    useVTTSubtitles: boolean
  ): IChannelManager {
    return new LoopChannelManager(
      process.env.LOOP_CHANNEL_NAME ? process.env.LOOP_CHANNEL_NAME : 'loop',
      useDemuxedAudio,
      useVTTSubtitles
    );
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}
