It is not mandatory to use an origin service to deliver FAST channels provided by the FAST Channel Engine as the engine in itself is an origin service, and in most cases it is sufficient with an origin shield or mid-tier CDN cache to pull from the engine channel endpoint.

However, there are some use cases where it may be necessary to use an origin service.

- Multi-format support (HLS and MPEG-DASH)
- DRM encryption
- DVR window for time-shift and ability to pause
