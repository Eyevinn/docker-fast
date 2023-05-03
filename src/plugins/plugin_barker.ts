import {
  IAssetManager,
  IChannelManager,
  VodRequest,
  VodResponse,
  Channel,
  ChannelProfile,
  IStreamSwitchManager,
  Schedule
} from 'eyevinn-channel-engine';
import { ScheduleStreamType } from 'eyevinn-channel-engine/dist/engine/server';
import fetch from 'node-fetch';
import { BasePlugin, PluginInterface } from './interface';

import {
  generateId,
  getDefaultChannelAudioProfile,
  getDefaultChannelVideoProfile
} from './utils';

class BarkerAssetManager implements IAssetManager {
  private fallbackVodToLoop: URL;

  constructor(fallbackVodToLoop: URL) {
    this.fallbackVodToLoop = fallbackVodToLoop;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    const vodResponse = {
      id: 'loop',
      title: 'VOD on Loop',
      uri: this.fallbackVodToLoop.toString()
    };
    return vodResponse;
  }
}

class BarkerChannelManager implements IChannelManager {
  private channelId: string;
  private useDemuxedAudio: boolean;

  constructor(channelId: string, useDemuxedAudio = false) {
    this.channelId = channelId;
    this.useDemuxedAudio = useDemuxedAudio;
    console.log(
      `Barker channel available at /channels/${this.channelId}/master.m3u8`
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
    const channelList = [channel];
    return channelList;
  }

  _getProfile(): ChannelProfile[] {
    return getDefaultChannelVideoProfile();
  }
}

class BarkerStreamSwitchManager implements IStreamSwitchManager {
  private schedule: Schedule[] = [];
  private liveStreams: URL[] = [];
  private startOffset = -1;
  private liveStreamListUrl: URL;
  private switchIntervalMs: number = 60 * 1000;

  constructor(liveStreamListUrl: URL, switchIntervalMs?: number) {
    this.liveStreamListUrl = liveStreamListUrl;
    this.switchIntervalMs = switchIntervalMs;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSchedule(channelId: string): Promise<Schedule[]> {
    if (this.liveStreams.length === 0) {
      console.log(
        'Fetching live stream list from ' + this.liveStreamListUrl.toString()
      );
      const response = await fetch(this.liveStreamListUrl.toString());
      if (response.ok) {
        const body = await response.text();
        this.liveStreams = body
          .split(/\r?\n/)
          .filter((l) => l !== '')
          .map((l) => new URL(l.trim()));
      }
    }

    const streamDuration = this.switchIntervalMs;
    const tsNow = Date.now();
    if (this.startOffset === -1) {
      this.startOffset = tsNow;
    }

    this.schedule = this.schedule.filter((obj) => obj.end_time >= tsNow);
    if (this.schedule.length === 0) {
      this.schedule.push({
        eventId: generateId(),
        assetId: generateId(),
        title: 'Live source A',
        type: ScheduleStreamType.LIVE,
        start_time: this.startOffset,
        end_time: this.startOffset + streamDuration,
        uri: this.liveStreams[
          Math.floor(Math.random() * this.liveStreams.length)
        ].toString()
      });
      this.startOffset += streamDuration;
      this.schedule.push({
        eventId: generateId(),
        assetId: generateId(),
        title: 'Live source B',
        type: ScheduleStreamType.LIVE,
        start_time: this.startOffset,
        end_time: this.startOffset + streamDuration,
        uri: this.liveStreams[
          Math.floor(Math.random() * this.liveStreams.length)
        ].toString()
      });
      this.startOffset += streamDuration;
    }
    return this.schedule;
  }
}

export class BarkerPlugin extends BasePlugin implements PluginInterface {
  constructor() {
    super('Barker');
  }

  newAssetManager(): IAssetManager {
    const vodToLoop = new URL(
      'https://lab.cdn.eyevinn.technology/sto-slate.mp4/manifest.m3u8'
    );
    return new BarkerAssetManager(vodToLoop);
  }

  newChannelManager(useDemuxedAudio: boolean): IChannelManager {
    return new BarkerChannelManager(
      process.env.BARKER_CHANNEL_NAME
        ? process.env.BARKER_CHANNEL_NAME
        : 'barker',
      useDemuxedAudio
    );
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    const liveStreamListUrl = process.env.BARKERLIST_URL
      ? process.env.BARKERLIST_URL
      : 'https://testcontent.eyevinn.technology/fast/barkertest.txt';
    const switchIntervalMs = process.env.SWITCH_INTERVAL_SEC
      ? parseInt(process.env.SWITCH_INTERVAL_SEC) * 1000
      : undefined;

    return new BarkerStreamSwitchManager(
      new URL(liveStreamListUrl),
      switchIntervalMs
    );
  }
}
