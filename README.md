# FAST Channel Engine
> *Open Source Sustainable FAST Channel Engine* 

[![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

The FAST Channel Engine is a sustainable FAST Channel Engine based on VOD2Live technology and the open source [Channel Engine library](https://github.com/Eyevinn/channel-engine) from Eyevinn Technology.

## Run FAST Channel Engine

To run the latest version of the FAST Channel Engine with the demo-plugin enabled.

```
docker run -d -p 8000:8000 -e FAST_PLUGIN=Demo \
  eyevinntechnology/fast-engine
```

Run a specific version of the FAST Channel Engine.

```
docker run -d -p 8000:8000 -e FAST_PLUGIN=Demo \
  eyevinntechnology/fast-engine:<version number>
```

Stream URL to address your HLS video player is then: `http://localhost:8000/channels/<channelId>/master.m3u8`

### Options

The following environment variables can be set:

- `PORT`: Which port to bind the service to.
- `FAST_PLUGIN`: Which plugin to use.

## Plugins

Specify plugin to use by setting the `FAST_PLUGIN` environment variable, e.g.

```
docker run -d -p 8000:8000 \
  -e FAST_PLUGIN=ScheduleService \
  -e SCHEDULE_SERVICE_API_URL=<api-url> \
  eyevinntechnology/fast-engine
```

The following plugins are available.

| Plugin | Desc |
| ------ | ---- |
| Demo   | Random selection from a pre-defined static list of assets |
| ScheduleService | Fetches schedule and channels from an [Eyevinn Schedule Service](https://github.com/Eyevinn/schedule-service) |

### Schedule Service Plugin Options

- `SCHEDULE_SERVICE_API_URL`: URL to Schedule Service API endpoint.

## Contributing

If you're interested in contributing to the project:

- We welcome all people who want to contribute in a healthy and constructive manner within our community. To help us create a safe and positive community experience for all, we require all participants to adhere to the [Code of Conduct](docs/CODE_OF_CONDUCT.md).
- If you are looking to make a code change first learn how to setup your local environment in our [Developer guide](docs/developer.md). Then create a Pull Request with suggested changes.
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