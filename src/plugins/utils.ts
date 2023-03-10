export function getDefaultChannelVideoProfile() {
  return [
    { bw: 4134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1024, 458] },
    { bw: 8134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1920, 1080] },
    { bw: 6134000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [1280, 720] },
    { bw: 2323000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [640, 286] },
    { bw: 1313000, codecs: "avc1.4d001f,mp4a.40.2", resolution: [480, 214] },
  ];
}

export function getDefaultChannelAudioProfile() {
  return [
    { language: "en", name: "English", default: true }
  ];
}