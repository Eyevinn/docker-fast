import { BasePlugin, PluginInterface } from "./plugin_interface";

class AssetManager {
  private assets;
  private pos;
  constructor() {
    this.assets = {
      1: [
        {
          id: 1,
          title: "Tears of Steel",
          uri: "https://maitv-vod.lab.eyevinn.technology/tearsofsteel_4k.mov/master.m3u8",
        },
        {
          id: 2,
          title: "VINN",
          uri: "https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8",
        },
      ],
    };
    this.pos = {
      1: 1,
    };
  }

  getNextVod(vodRequest) {
    return new Promise((resolve, reject) => {
      const channelId = vodRequest.playlistId;
      if (this.assets[channelId]) {
        let vod = this.assets[channelId][this.pos[channelId]++];
        if (this.pos[channelId] > this.assets[channelId].length - 1) {
          this.pos[channelId] = 0;
        }
        const vodResponse = {
          id: vod.id,
          title: vod.title,
          uri: vod.uri,
        };
        resolve(vodResponse);
      }
      else {
        reject("Invalid channelId provided");
      }
    });
  }
}

class ChannelManager {
  getChannels() {
    return [{ id: "1", profile: this._getProfile() }];
  }

  _getProfile() {
    return [
      { bw: 6134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1024, 458] },
      { bw: 2323000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [640, 286] },
      { bw: 1313000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [480, 214] },
    ];
  }
}

export class DemoPlugin extends BasePlugin implements PluginInterface  {
  newAssetManager() {
    return new AssetManager();
  }

  newChannelManager() {
    return new ChannelManager();
  }
}