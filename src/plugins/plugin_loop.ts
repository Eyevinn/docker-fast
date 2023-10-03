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
  getDefaultChannelSubtitleProfile,
  getVodUrlWithPreroll
} from './utils';

class LoopAssetManager implements IAssetManager {
  private vodToLoop: URL;
  private prerollVod: URL = undefined;
  private prerollDurationMs: number;

  constructor(vodToLoop: URL, prerollVod?: URL, prerollDurationMs?: number) {
    this.vodToLoop = vodToLoop;
    this.prerollVod = prerollVod;
    this.prerollDurationMs = prerollDurationMs;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    let hlsUrl = this.vodToLoop.toString();
    if (this.prerollVod) {
      hlsUrl = getVodUrlWithPreroll(
        this.vodToLoop.toString(),
        this.prerollVod.toString(),
        this.prerollDurationMs
      );
    }
    const vodResponse = {
      id: 'loop',
      title: 'VOD on Loop',
      uri: hlsUrl
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
    const prerollVod = process.env.LOOP_PREROLL_URL
      ? new URL(process.env.LOOP_PREROLL_URL)
      : undefined;
    const prerollVodDurationMs =
      prerollVod && process.env.LOOP_PREROLL_DURATION_MS
        ? parseInt(process.env.LOOP_PREROLL_DURATION_MS)
        : undefined;
    return new LoopAssetManager(vodToLoop, prerollVod, prerollVodDurationMs);
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
