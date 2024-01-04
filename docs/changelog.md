# Release Notes

## Version 1.9.0

New Features:

- Option for the WebHook plugin to provide api-key on webhook request

Channel Engine v4.3.11 including the following bugfixes and features:

- Add Reset by Channel feature
- Option to protect session health endpoint with a key
- Fix timeOffset - Once enabled, Forever
- Fix missing Newlines in Dummy Webvtt Response
- Fix performance bottlenecks when running in High Availability mode with Redis.
- Fix disable eventstream by default
- Fix HA & Demux - Audio Increment Not Respecting Position Diff-Threshold
- Fix Subtitle Track Playhead is dependant Of Video Track
- Fix Wrong Audio M3U8 When Request Is Mid-Loading Next Vod
- Fix add subtitle media sequence data to insertSlate function

## Version 1.8.0

New Features:

- All plugins now supporting insertion of prerolls (house ads). This functionality requires an external stitcher endpoint.
- WebHook plugin now supports trimming of VOD by setting a start offset and / or duration.

### Version 1.8.1

Verify URLs that must be HLS URLs

### Version 1.8.2

The channelId query param was appended on each request

## Version 1.7.0

New Features:

- New plugin that enables the option to use a custom webhook (HTTP callback) for the engine to decide what to play next in a channel

Channel Engine v4.2.3 including the following bugfixes and features:

- Handle error when switching LIVE to LIVE with preroll
- Fix edge case when new leader not initiating next vod correctly (HA mode)
- Option to create channel on demand (by client request)

### Version 1.7.2

Resolves a build error in 1.7.0 release

### Version 1.7.3

Configurable VTT base path

### Version 1.7.4

Preset for channels with HEVC content

## Version 1.6.0

New Features:

- Support for VTT subtitles

Channel Engine v4.2.0 including the support for VTT subtitles.

## Version 1.5.0

New Features:

- New plugin to produce barker channel by switching between live channels at a given interval

## Version 1.4.0

New Features:

- Playlist plugin can handle a list of playlists

### Version 1.4.1

Channel Engine v4.0.20 including the following bugfix:

- Handle VOD with byterange without offset

## Version 1.3.0

New Features:

- Support for channel presets and advanced audio codecs
- Container options to set channel preset and language list: `OPTS_CHANNEL_PRESET`, `OPTS_LANG_LIST`

Channel Engine v4.0.8 including the following bugfixes:

- Support for multi audio codec channels
- Correct audio group was not always chosen

### Version 1.3.1

Channel Engine v4.0.12 including the following bugfixes:

- HA-mode fixes and upgraded redis-client to support Redis engine v6. Redis v7 is not yet supported
- Invalid audio group could be referenced by a stream

## Version 1.2.0

New Features:

- Container option to override default video profile
- Container option to configure the order of the video streams

Channel Engine v4.0.6 including the following bugfixes:

- Cache directive for index / master manifest
- Additional HA-mode fixes

## Version 1.1.0

Upgrade to Channel Engine v4.0.0 which enables support for HLS-CMAF sources. Latest patch version below.

### Version 1.1.4

Channel Engine v4.0.5 including the following bugfixes:

- Option to exclude ssesion-data-tags in index / master manifest
- Handle the case when there are more video media sequences than audio media sequences

### Version 1.1.3

Channel Engine v4.0.3 including the following bugfixes:

- Buffer stalling issues in HA mode
- Remove redundant and confusing audio-only streams in index / master manifest
- Get up-to-date playhead-state data after waiting for nextVod load

### Version 1.1.2

Bugfixes:

- Handle VODs using BYTERANGE

### Version 1.1.1

Bugfixes:

- Handle channels from Schedule Service that has a multi audio configuration

## Version 1.0.1

**The Sustainable FAST Channel Engine**

Based on the open source VOD2Live Engine library, [Eyevinn Channel Engine](https://github.com/Eyevinn/channel-engine), we provide you with an off-the-shelf Docker container that enables you to produce numerous amounts of FAST channels to a fraction of the energy consumption compared with traditional methods. Using the VOD2Live technology means that you remove the redundant transcoding and packaging that are involved when live transcoding a linear FAST channel.

With the plugins included in this reelase you can either produce a single channel per container based on a playlist-file or produce multiple channel per container by connecting it to the [Eyevinn Schedule Service](https://github.com/Eyevinn/schedule-service).

- Loop: Produce a channel with a single VOD on loop
- Playlist: Produce a channel based on a playlist txt file
- Schedule Service: Fetches schedule and channels from an [Eyevinn Schedule Service](https://github.com/Eyevinn/schedule-service)

Features included in this release:

- Multiview of all channels served by the running container
- Demo plugin where you can for demonstration purpose launch a configurable amount channels for demo
