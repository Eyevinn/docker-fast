import { IAssetManager, IChannelManager, 
  VodRequest, VodResponse, 
  Channel, ChannelProfile, IStreamSwitchManager 
} from "eyevinn-channel-engine";
import { BasePlugin, PluginInterface } from "./plugin_interface";

const DEMO_NUM_CHANNELS = process.env.DEMO_NUM_CHANNELS ? parseInt(process.env.DEMO_NUM_CHANNELS, 10) : 12;
const DEFAULT_ASSETS = [
  "https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8",
  "https://lab.cdn.eyevinn.technology/stswe19-industry-group-low-latency-hls.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/stswe19-global-but-local-ott-platform.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/stswe19-serverless-media-processing-at-netflix.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/NO_TIME_TO_DIE_short_Trailer_2021.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/THE_GRAND_BUDAPEST_HOTEL_Trailer_2014.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/stswe19-three-roads-to-jerusalem.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/wrc-jbi-arvija-finland-220126.mov/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/stswe19-challenge-to-preserver-creators-intent.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/BAAHUBALI_3_Trailer_2021.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/stswe22-talks-teaser-Z4-ehLIMe8.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/OWL_MVP_2021.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/stswe22-webrtc-flt5fm7bR3.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/wrc-jbi-sweden-220126-BP4uTVw_FV.mp4/manifest.m3u8",
  "https://lab.cdn.eyevinn.technology/f1-monaco-5l-jan8-5ULu9E6C_t.mov/manifest.m3u8",
  "https://maitv-vod.lab.eyevinn.technology/tearsofsteel_4k.mov/master.m3u8",
]

class AssetManager implements IAssetManager {
  private assets;
  private pos;
  constructor() {
    this.assets = {};
    this.pos = {};
    for (let i = 0; i < DEMO_NUM_CHANNELS; i++) {
      this.assets[i+1] = [];
      DEFAULT_ASSETS.forEach(asset => {
        this.assets[i+1].push({
          id: i + 1,
          title: `Asset ${i + 1}`,
          uri: asset,
        });
      });
      this.pos[i+1] = Math.floor(Math.random() * DEFAULT_ASSETS.length);
    }
  }

  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
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
      return vodResponse;
    }
    else {
      throw new Error("Invalid channelId provided");
    }
  }
}

class ChannelManager implements IChannelManager {
  getChannels(): Channel[] {
    const channelList = [];
    for (let i = 0; i < DEMO_NUM_CHANNELS; i++) {
      channelList.push({
        id: `${i + 1}`, profile: this._getProfile()
      });
    }
    return channelList;
  }

  _getProfile(): ChannelProfile[] {
    return [
      { bw: 6134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1024, 458] },
      { bw: 2323000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [640, 286] },
      { bw: 1313000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [480, 214] },
    ];
  }
}

export class DemoPlugin extends BasePlugin implements PluginInterface  {
  constructor() {
    super('Demo');
  }
  
  newAssetManager(): IAssetManager {
    return new AssetManager();
  }

  newChannelManager(): IChannelManager {
    return new ChannelManager();
  }

  newStreamSwitchManager(): IStreamSwitchManager {
    return undefined;
  }
}