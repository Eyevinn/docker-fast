import { IAssetManager, IChannelManager, 
  VodRequest, VodResponse, 
  Channel, ChannelProfile, IStreamSwitchManager 
} from "eyevinn-channel-engine";
import fetch from "node-fetch";

import { BasePlugin, PluginInterface } from "./plugin_interface";

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

  constructor(channelId: string) {
    this.channelId = channelId;
    console.log(`Playlist channel available at /channels/${this.channelId}/master.m3u8`);
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
      { bw: 8134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1920, 1080] },
      { bw: 6134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1280, 720] },
      { bw: 4134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1024, 458] },
      { bw: 2323000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [640, 286] },
      { bw: 1313000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [480, 214] },
    ];
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

  newChannelManager(): IChannelManager {
    return new PlaylistChannelManager(process.env.PLAYLIST_CHANNEL_NAME ? process.env.PLAYLIST_CHANNEL_NAME : "playlist");
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}