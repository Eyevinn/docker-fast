import {
  IAssetManager,
  IChannelManager,
  VodRequest,
  VodResponse,
  Channel,
  ChannelProfile,
  IStreamSwitchManager
} from 'eyevinn-channel-engine';
import fetch from 'node-fetch';

import { BasePlugin, PluginInterface } from './interface';
import {
  getDefaultChannelAudioProfile,
  getDefaultChannelVideoProfile,
  getDefaultChannelSubtitleProfile,
  getVodUrlWithPreroll,
  resolveRedirect
} from './utils';

export interface WebHookNextVodResponse {
  id: string;
  title: string;
  hlsUrl: string;
  type: string; // 'gap' or null
  prerollUrl?: string;
  prerollDurationMs?: number;
  desiredOffsetMs?: number;
  desiredDurationMs?: number;
}

class WebHookAssetManager implements IAssetManager {
  private webHook: URL;
  private apiKey?: string;

  constructor({ webHook, apiKey }: { webHook: URL; apiKey?: string }) {
    this.webHook = webHook;
    this.apiKey = apiKey;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    const nextVodUrl = this.webHook;
    nextVodUrl.searchParams.set('channelId', vodRequest.playlistId);
    let headers;
    if (this.apiKey) {
      headers = {
        Authorization: `Bearer ${this.apiKey}`
      };
    }
    const response = await fetch(nextVodUrl.toString(), {
      method: 'GET',
      headers
    });
    if (response.ok) {
      const payload: WebHookNextVodResponse = await response.json();
      let hlsUrl = await resolveRedirect(payload.hlsUrl);
      if (payload.prerollUrl && payload.prerollDurationMs) {
        hlsUrl = getVodUrlWithPreroll(
          hlsUrl,
          payload.prerollUrl,
          payload.prerollDurationMs
        );
      }
      const vodResponse: VodResponse = {
        id: payload.id,
        title: payload.title,
        uri: hlsUrl,
        type: payload.type === 'gap' ? 'gap' : null,
        desiredDuration: payload.desiredDurationMs,
        startOffset: payload.desiredOffsetMs
      };
      console.log(vodResponse);
      return vodResponse;
    } else {
      throw new Error(
        'Failed to get VOD from webhook: ' + nextVodUrl.toString()
      );
    }
  }
}

class WebHookChannelManager implements IChannelManager {
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
      `WebHook channel available at /channels/${this.channelId}/master.m3u8`
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

export class WebHookPlugin extends BasePlugin implements PluginInterface {
  constructor() {
    super('WebHook');
  }

  newAssetManager(): IAssetManager {
    const webHook = process.env.WEBHOOK_URL
      ? new URL(process.env.WEBHOOK_URL)
      : new URL('http://localhost:8002/nextVod');
    const apiKey = process.env.OPTS_WEBHOOK_APIKEY;
    return new WebHookAssetManager({ webHook, apiKey });
  }

  newChannelManager(
    useDemuxedAudio: boolean,
    useVTTSubtitles: boolean
  ): IChannelManager {
    return new WebHookChannelManager(
      process.env.WEBHOOK_CHANNEL_NAME
        ? process.env.WEBHOOK_CHANNEL_NAME
        : 'hls',
      useDemuxedAudio,
      useVTTSubtitles
    );
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}
