const DEFAULT_VIDEO_STREAMS = [
  { bw: 324586, codecs: "avc1.64000D,mp4a.40.2", resolution: [416, 234] },
  { bw: 471661, codecs: "avc1.64001E,mp4a.40.2", resolution: [640, 360] },
  { bw: 584829, codecs: "avc1.64001E,mp4a.40.2", resolution: [768, 432] },
  { bw: 799817, codecs: "avc1.64001F,mp4a.40.2", resolution: [960, 540] },
  { bw: 2248046, codecs: "avc1.64001F,mp4a.40.2", resolution: [1280, 720] },
  { bw: 9602303, codecs: "avc1.640028,mp4a.40.2", resolution: [1920, 1080] },
];

function parseOptsVideoStreams(optsVideoStream?: string) {
  if (!optsVideoStream) {
    return DEFAULT_VIDEO_STREAMS;
  }

  let streams = [];
  optsVideoStream.split(",").forEach(item => {
    const m = item.match(/^(\d+)x(\d+):(\d+)/);
    if (m) {
      const stream = {
        bw: parseInt(m[3]),
        codecs: "avc1.4d001f,mp4a.40.2",
        resolution: [ parseInt(m[1]), parseInt(m[2]) ]
      };
      streams.push(stream);
    }
  });

  return streams;
}

function streamByHeight(streams, height: number) {
  return streams.find(r => r.resolution[1] === height);
}

export function getDefaultChannelVideoProfile() {
  let streams = parseOptsVideoStreams(process.env.OPTS_VIDEO_STREAMS);
  if (process.env.OPTS_STREAM_ORDER) {
    let newStreams = [];
    const streamOrder = process.env.OPTS_STREAM_ORDER.split(",");
    for(const height of streamOrder) {
      const stream = streamByHeight(streams, parseInt(height));
      if (stream) {
        newStreams.push(stream);
      }
    }
    streams = newStreams;
    console.log(streams);
  }
  return streams;
}

export function getDefaultChannelAudioProfile() {
  return [
    { language: "en", name: "English", default: true }
  ];
}