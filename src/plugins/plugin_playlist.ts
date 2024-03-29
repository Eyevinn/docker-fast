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
  getDefaultChannelSubtitleProfile,
  getDefaultChannelVideoProfile,
  getVodUrlWithPreroll,
  resolveRedirect
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
  private prerollVod: URL = undefined;
  private prerollDurationMs: number;

  constructor(
    playlistUrls: PlaylistUrl[],
    prerollVod?: URL,
    prerollDurationMs?: number
  ) {
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
    this.prerollVod = prerollVod;
    this.prerollDurationMs = prerollDurationMs;
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
        let hlsUrl = await resolveRedirect(
          playlist.hlsUrls[playlist.position].toString()
        );
        if (this.prerollVod) {
          hlsUrl = getVodUrlWithPreroll(
            playlist.hlsUrls[playlist.position].toString(),
            this.prerollVod.toString(),
            this.prerollDurationMs
          );
        }
        vodResponse = {
          id: `${playlist.position}`,
          title: `Item ${playlist.position}`,
          uri: hlsUrl
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
  private useVTTSubtitles: boolean;

  constructor(
    channelIds: string[],
    useDemuxedAudio: boolean,
    useVTTSubtitles: boolean
  ) {
    this.channelIds = channelIds;
    this.useDemuxedAudio = useDemuxedAudio;
    this.useVTTSubtitles = useVTTSubtitles;
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
      if (this.useVTTSubtitles) {
        channel.subtitleTracks = getDefaultChannelSubtitleProfile();
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
    const prerollVod = process.env.PLAYLIST_PREROLL_URL
      ? new URL(process.env.PLAYLIST_PREROLL_URL)
      : undefined;
    const prerollVodDurationMs =
      prerollVod && process.env.PLAYLIST_PREROLL_DURATION_MS
        ? parseInt(process.env.PLAYLIST_PREROLL_DURATION_MS)
        : undefined;

    if (prerollVod && !prerollVod.toString().match(/\.m3u8$/)) {
      throw new Error('Unsupported preroll VOD type: ' + prerollVod.toString());
    }

    return new PlaylistAssetManager(
      parsePlaylistUrlParam(param),
      prerollVod,
      prerollVodDurationMs
    );
  }

  newChannelManager(
    useDemuxedAudio: boolean,
    useVTTSubtitles: boolean
  ): IChannelManager {
    const param = process.env.PLAYLIST_URL
      ? process.env.PLAYLIST_URL
      : 'https://testcontent.eyevinn.technology/fast/fast-playlist.txt';

    const channels = parsePlaylistUrlParam(param).map((p) => p.id);

    return new PlaylistChannelManager(
      channels,
      useDemuxedAudio,
      useVTTSubtitles
    );
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}
