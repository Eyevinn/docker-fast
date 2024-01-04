import {
  AudioTracks,
  ChannelProfile,
  SubtitleTracks
} from 'eyevinn-channel-engine';
import { Language, StitchPayload } from './interface';
import fetch from 'node-fetch';

import { uuid } from 'uuidv4';

const DEFAULT_VIDEO_STREAMS: ChannelProfile[] = [
  { bw: 324586, codecs: 'avc1.64000D,mp4a.40.2', resolution: [416, 234] },
  { bw: 471661, codecs: 'avc1.64001E,mp4a.40.2', resolution: [640, 360] },
  { bw: 584829, codecs: 'avc1.64001E,mp4a.40.2', resolution: [768, 432] },
  { bw: 799817, codecs: 'avc1.64001F,mp4a.40.2', resolution: [960, 540] },
  { bw: 2248046, codecs: 'avc1.64001F,mp4a.40.2', resolution: [1280, 720] },
  { bw: 9602303, codecs: 'avc1.640028,mp4a.40.2', resolution: [1920, 1080] }
];

const DEFAULT_AUDIO_TRACKS: AudioTracks[] = [
  { language: 'en', name: 'English', default: true }
];

const DEFAULT_SUBTITLE_TRACKS: SubtitleTracks[] = [
  { language: 'sv', name: 'Swedish', default: true }
];

const CHANNEL_PRESETS = {
  ATMOS: {
    video: [
      {
        resolution: [640, 360],
        bw: 3663471,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1280, 720],
        bw: 5841380,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1920, 1080],
        bw: 8973571,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },

      {
        resolution: [640, 360],
        bw: 4301519,
        codecs: 'avc1.64001F,ec-3',
        channels: '16/JOC'
      },
      {
        resolution: [1280, 720],
        bw: 6479428,
        codecs: 'avc1.64001F,ec-3',
        channels: '16/JOC'
      },
      {
        resolution: [1920, 1080],
        bw: 9611619,
        codecs: 'avc1.640032,ec-3',
        channels: '16/JOC'
      }
    ],
    audio: [{ language: 'en', name: 'English', default: true }]
  },
  DD: {
    video: [
      {
        resolution: [640, 360],
        bw: 3663471,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1280, 720],
        bw: 5841380,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1920, 1080],
        bw: 8973571,
        codecs: 'avc1.64001F,mp4a.40.2',
        channels: '2'
      },

      {
        resolution: [640, 360],
        bw: 4301519,
        codecs: 'avc1.64001F,ac-3',
        channels: '6'
      },
      {
        resolution: [1280, 720],
        bw: 6479428,
        codecs: 'avc1.64001F,ac-3',
        channels: '6'
      },
      {
        resolution: [1920, 1080],
        bw: 9611619,
        codecs: 'avc1.640032,ac-3',
        channels: '6'
      }
    ],
    audio: [{ language: 'en', name: 'English', default: true }]
  },
  HEVC: {
    video: [
      {
        resolution: [640, 360],
        bw: 1078026,
        codecs: 'hvc1.2.4.L123.90,mp4a.40.2',
        channels: '2'
      },
      {
        resolution: [1280, 720],
        bw: 2627520,
        codecs: 'hvc1.2.4.L123.90,mp4a.40.2',
        channels: 2
      },
      {
        resolution: [1920, 1080],
        bw: 4589413,
        codecs: 'hvc1.2.4.L123.90,mp4a.40.2',
        channels: 2
      }
    ],
    audio: [{ language: 'en', name: 'English', default: true }]
  }
};

function parseOptsVideoStreams(optsVideoStream?: string): ChannelProfile[] {
  if (!optsVideoStream) {
    return DEFAULT_VIDEO_STREAMS;
  }

  const streams = [];
  optsVideoStream.split(',').forEach((item) => {
    const m = item.match(/^(\d+)x(\d+):(\d+)/);
    if (m) {
      const stream = {
        bw: parseInt(m[3]),
        codecs: 'avc1.4d001f,mp4a.40.2',
        resolution: [parseInt(m[1]), parseInt(m[2])]
      };
      streams.push(stream);
    }
  });

  return streams;
}

function streamByHeight(streams, height: number) {
  return streams.find((r) => r.resolution[1] === height);
}

export function getDefaultChannelVideoProfile(): ChannelProfile[] {
  if (
    process.env.OPTS_CHANNEL_PRESET &&
    CHANNEL_PRESETS[process.env.OPTS_CHANNEL_PRESET]
  ) {
    const videoProfile = CHANNEL_PRESETS[process.env.OPTS_CHANNEL_PRESET].video;
    return videoProfile;
  } else {
    let streams = parseOptsVideoStreams(process.env.OPTS_VIDEO_STREAMS);
    if (process.env.OPTS_STREAM_ORDER) {
      const newStreams = [];
      const streamOrder = process.env.OPTS_STREAM_ORDER.split(',');
      for (const height of streamOrder) {
        const stream = streamByHeight(streams, parseInt(height));
        if (stream) {
          newStreams.push(stream);
        }
      }
      streams = newStreams;
    }
    return streams;
  }
}

export function getDefaultChannelAudioProfile(): AudioTracks[] {
  const langList = process.env.OPTS_LANG_LIST;
  if (langList) {
    const audioTracks = [];
    const languages = langList.split(',');
    for (let i = 0; i < languages.length; i++) {
      const lang: Language = {
        language: languages[i],
        name: languages[i],
        default: i === 0
      };
      audioTracks.push(lang);
    }
    return audioTracks;
  } else if (
    process.env.OPTS_CHANNEL_PRESET &&
    CHANNEL_PRESETS[process.env.OPTS_CHANNEL_PRESET]
  ) {
    return CHANNEL_PRESETS[process.env.OPTS_CHANNEL_PRESET].audio;
  } else {
    return DEFAULT_AUDIO_TRACKS;
  }
}

export function getDefaultChannelSubtitleProfile(): SubtitleTracks[] {
  const langList = process.env.OPTS_LANG_LIST_SUBS;
  if (langList) {
    const subtitleTracks = [];
    const languages = langList.split(',');
    for (let i = 0; i < languages.length; i++) {
      const lang: Language = {
        language: languages[i],
        name: languages[i],
        default: i === 0
      };
      subtitleTracks.push(lang);
    }
    return subtitleTracks;
  } else {
    return DEFAULT_SUBTITLE_TRACKS;
  }
}

export function generateId(): string {
  return uuid();
}

function serialize<T>(payload: T) {
  const buff = Buffer.from(JSON.stringify(payload));
  return buff.toString('base64');
}

export function getVodUrlWithPreroll(
  url: string,
  prerollUrl: string,
  prerollDurationMs: number
): string {
  if (process.env.OPTS_STITCH_ENDPOINT) {
    const payload: StitchPayload = {
      uri: url,
      breaks: [
        {
          pos: 0,
          duration: prerollDurationMs,
          url: prerollUrl
        }
      ]
    };
    return (
      process.env.OPTS_STITCH_ENDPOINT +
      `/master.m3u8?payload=` +
      serialize<StitchPayload>(payload)
    );
  }
  return url;
}

export async function resolveRedirect(url: string) {
  try {
    const response = await fetch(url);
    if (response.redirected) {
      console.log('Redirect: ' + response.url);
      return response.url || url;
    }
  } catch (err) {
    console.error(err);
  }
  return url;
}
