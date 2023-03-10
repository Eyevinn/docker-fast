import { IAssetManager, IChannelManager, 
  VodRequest, VodResponse, 
  Channel, ChannelProfile, IStreamSwitchManager 
} from "eyevinn-channel-engine";
import fetch from "node-fetch";

import { BasePlugin, PluginInterface } from "./interface";
import { getDefaultChannelAudioProfile, getDefaultChannelVideoProfile } from "./utils";

class PlaylistAssetManager implements IAssetManager {
  private playlistUrl: URL;
  private playlist: URL[];
  private playlistPosition: number;

  constructor(playlistUrl: URL) {
    this.playlistUrl = playlistUrl;
    this.playlist = undefined;
    this.playlistPosition = -1;
  }

  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    let vodResponse = {
      id: "-1",
      title: "placeholder",
      uri: "https://lab.cdn.eyevinn.technology/sto-slate.mp4/manifest.m3u"
    };
    try {
      if (!this.playlist) {
        await this._updatePlaylist();
      }
      if (this.playlistPosition !== -1) {
        vodResponse = {
          id: `${this.playlistPosition}`,
          title: `Item ${this.playlistPosition}`,
          uri: this.playlist[this.playlistPosition].toString(),
        };
        this.playlistPosition++;
        if (this.playlistPosition > this.playlist.length - 1) {
          this.playlistPosition = 0;
        }
      }
    } catch (e) {
      console.log(e);
    }
    return vodResponse;
  }

  private async _updatePlaylist() {
    console.log("Fetching playlist from " + this.playlistUrl);
    const response = await fetch(this.playlistUrl.toString());
    if (response.ok) {
      const body = await response.text();
      this.playlist = body.split(/\r?\n/).filter(l => l !== '').map(l => new URL(l.trim()));
      this.playlistPosition = 0;
    }
  }
}

class PlaylistChannelManager implements IChannelManager {
  private channelId: string;
  private useDemuxedAudio: boolean;

  constructor(channelId: string, useDemuxedAudio: boolean) {
    this.channelId = channelId;
    this.useDemuxedAudio = useDemuxedAudio;
    console.log(`Playlist channel available at /channels/${this.channelId}/master.m3u8`);
  }

  getChannels(): Channel[] {
    let channel: Channel = {
      id: this.channelId,
      profile: this._getProfile()
    };
    if (this.useDemuxedAudio) {
      channel.audioTracks = getDefaultChannelAudioProfile();
    }
    const channelList = [ channel ];
    return channelList;
  }

  _getProfile(): ChannelProfile[] {
    return getDefaultChannelVideoProfile();
  }
}

export class PlaylistPlugin extends BasePlugin implements PluginInterface  {
  constructor() {
    super('Playlist');
  }
  
  newAssetManager(): IAssetManager {
    const playlistUrl = process.env.PLAYLIST_URL ? new URL(process.env.PLAYLIST_URL) 
      : new URL("https://testcontent.eyevinn.technology/fast/fast-playlist.txt");
    return new PlaylistAssetManager(playlistUrl);
  }

  newChannelManager(useDemuxedAudio: boolean): IChannelManager {
    return new PlaylistChannelManager(process.env.PLAYLIST_CHANNEL_NAME ? process.env.PLAYLIST_CHANNEL_NAME : "playlist", useDemuxedAudio);
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}