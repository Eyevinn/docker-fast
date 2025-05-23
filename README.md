# FAST Channel Engine
> *Open Source Sustainable FAST Channel Engine* 

[![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

[![Badge OSC](https://img.shields.io/badge/Evaluate-24243B?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8yODIxXzMxNjcyKSIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI3IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiLz4KPGRlZnM%2BCjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8yODIxXzMxNjcyIiB4MT0iMTIiIHkxPSIwIiB4Mj0iMTIiIHkyPSIyNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjQzE4M0ZGIi8%2BCjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzREQzlGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM%2BCjwvc3ZnPgo%3D)](https://app.osaas.io/browse/channel-engine)

[ [DOCS](https://fast.docs.eyevinn.technology) | [DEMO](https://vod2live.eyevinn.technology) ]

The FAST Channel Engine is a sustainable FAST Channel Engine based on VOD2Live technology and the open source [Channel Engine library](https://vod2live.docs.eyevinn.technology) from Eyevinn Technology.

![Screenshot multiview](docs/images/ui-screenshot.png)

## Quick Start

To spin up a Schedule Service and FAST Channel Engine.

```bash
curl -SL https://github.com/Eyevinn/docker-fast/releases/download/v0.2.0/docker-compose.yml | docker-compose -f - up
```

A demo channel called `eyevinn` is created by default. To get the schedule for a specific date `YYYY-MM-DD`.

```bash
curl -X 'GET' \
  'http://localhost:8080/api/v1/channels/eyevinn/schedule?date=YYYY-MM-DD' \
  -H 'accept: application/json'
```

And to play the channel direct your HLS video player to the URL [http://localhost:8000/channels/eyevinn/master.m3u8](http://web.player.eyevinn.technology/?manifest=http%3A%2F%2Flocalhost%3A8000%2Fchannels%2Feyevinn%2Fmaster.m3u8)

You might need to wait a few minutes first for the channel to be ready.

## Contributing

If you're interested in contributing to the project:

- We welcome all people who want to contribute in a healthy and constructive manner within our community. To help us create a safe and positive community experience for all, we require all participants to adhere to the [Code of Conduct](CODE_OF_CONDUCT.md).
- If you are looking to make a code change create a Pull Request with suggested changes.
- Develop and contribute with scheduling service plugins.
- Report, triage bugs or suggest enhancements.
- Help others by answering questions.

## License (Apache-2.0)

```
Copyright 2022 Eyevinn Technology AB

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

## About Eyevinn Technology

[Eyevinn Technology](https://www.eyevinntechnology.se) is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor. As our way to innovate and push the industry forward we develop proof-of-concepts and tools. The things we learn and the code we write we share with the industry in [blogs](https://dev.to/video) and by open sourcing the code we have written.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
