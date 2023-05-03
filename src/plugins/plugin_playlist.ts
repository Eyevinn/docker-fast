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
  getDefaultChannelVideoProfile
} from './utils';

interface PlaylistUrl {
  id: string;
  url: URL;
}

interface Playlist {
  id: string;
  url: URL;
  hlsUrls?: URL[];
  position: number;
}

function parsePlaylistUrlParam(playlistUrlParam: string): PlaylistUrl[] {
  const playlistUrls = [];

  if (playlistUrlParam.match(/^\S+\|\S+$/)) {
    const tupels = playlistUrlParam.split(',').map((t) => t.trim());
    tupels.forEach((tupel) => {
      const [channelName, playlistUrl] = tupel.split('|');
      if (channelName && playlistUrl) {
        playlistUrls.push({
          id: channelName,
          url: playlistUrl
        });
      }
    });
  } else {
    playlistUrls.push({
      id: process.env.PLAYLIST_CHANNEL_NAME
        ? process.env.PLAYLIST_CHANNEL_NAME
        : 'playlist',
      url: playlistUrlParam
    });
  }
  return playlistUrls;
}

class PlaylistAssetManager implements IAssetManager {
  private playlistUrls: PlaylistUrl[];
  private playlists: Map<string, Playlist>;

  constructor(playlistUrls: PlaylistUrl[]) {
    this.playlistUrls = playlistUrls;
    this.playlists = new Map<string, Playlist>();
    this.playlistUrls.forEach((playlistUrl) => {
      const playlist: Playlist = {
        id: playlistUrl.id,
        url: playlistUrl.url,
        hlsUrls: undefined,
        position: -1
      };
      this.playlists.set(playlist.id, playlist);
    });
  }

  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    let vodResponse = {
      id: '-1',
      title: 'placeholder',
      uri: 'https://lab.cdn.eyevinn.technology/sto-slate.mp4/manifest.m3u'
    };
    try {
      const playlist = this.playlists.get(vodRequest.playlistId);
      if (playlist && !playlist.hlsUrls) {
        await this._updatePlaylist(vodRequest.playlistId);
      }
      if (playlist.position !== -1) {
        vodResponse = {
          id: `${playlist.position}`,
          title: `Item ${playlist.position}`,
          uri: playlist.hlsUrls[playlist.position].toString()
        };
        playlist.position++;
        if (playlist.position > playlist.hlsUrls.length - 1) {
          playlist.position = 0;
        }
      }
    } catch (e) {
      console.log(e);
    }
    return vodResponse;
  }

  private async _updatePlaylist(playlistId: string) {
    const playlist = this.playlists.get(playlistId);
    console.log('Fetching playlist from ' + playlist.url);
    const response = await fetch(playlist.url.toString());
    if (response.ok) {
      const body = await response.text();
      playlist.hlsUrls = body
        .split(/\r?\n/)
        .filter((l) => l !== '')
        .map((l) => new URL(l.trim()));
      playlist.position = 0;
    }
  }
}

class PlaylistChannelManager implements IChannelManager {
  private channelIds: string[];
  private useDemuxedAudio: boolean;

  constructor(channelIds: string[], useDemuxedAudio: boolean) {
    this.channelIds = channelIds;
    this.useDemuxedAudio = useDemuxedAudio;
    this.channelIds.forEach((id) => {
      console.log(`Playlist channel available at /channels/${id}/master.m3u8`);
    });
  }

  getChannels(): Channel[] {
    const channelList = [];
    this.channelIds.forEach((channelId) => {
      const channel: Channel = {
        id: channelId,
        profile: this._getProfile()
      };
      if (this.useDemuxedAudio) {
        channel.audioTracks = getDefaultChannelAudioProfile();
      }
      channelList.push(channel);
    });
    return channelList;
  }

  _getProfile(): ChannelProfile[] {
    return getDefaultChannelVideoProfile();
  }
}

export class PlaylistPlugin extends BasePlugin implements PluginInterface {
  constructor() {
    super('Playlist');
  }

  newAssetManager(): IAssetManager {
    const param = process.env.PLAYLIST_URL
      ? process.env.PLAYLIST_URL
      : 'https://testcontent.eyevinn.technology/fast/fast-playlist.txt';

    return new PlaylistAssetManager(parsePlaylistUrlParam(param));
  }

  newChannelManager(useDemuxedAudio: boolean): IChannelManager {
    const param = process.env.PLAYLIST_URL
      ? process.env.PLAYLIST_URL
      : 'https://testcontent.eyevinn.technology/fast/fast-playlist.txt';

    const channels = parsePlaylistUrlParam(param).map((p) => p.id);

    return new PlaylistChannelManager(channels, useDemuxedAudio);
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}
