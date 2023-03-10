const DEFAULT_VIDEO_STREAMS = [
  { bw: 4134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1024, 458] },
  { bw: 8134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1920, 1080] },
  { bw: 6134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1280, 720] },
  { bw: 2323000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [640, 286] },
  { bw: 1313000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [480, 214] },
];

function streamByHeight(height: number) {
  return DEFAULT_VIDEO_STREAMS.find(r => r.resolution[1] === height);
}

export function getDefaultChannelVideoProfile() {
  if (!process.env.OPTS_STREAM_ORDER) {
    return DEFAULT_VIDEO_STREAMS;
  } else {
    let streams = [];
    const streamOrder = process.env.OPTS_STREAM_ORDER.split(",");
    for(const height of streamOrder) {
      const stream = streamByHeight(parseInt(height));
      if (stream) {
        streams.push(stream);
      }
    }
    return streams;
  }
}

export function getDefaultChannelAudioProfile() {
  return [
    { language: "en", name: "English", default: true }
  ];
}