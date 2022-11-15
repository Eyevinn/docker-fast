# FAST by Eyevinn Technology

The Sustainable FAST Channel Engine

---

Based on VOD2Live Technology and the [open source Eyevinn Channel Engine library](https://github.com/Eyevinn/channel-engine) you can generate a numerous amounts of FAST channels with a fraction of energy consumption compared to live transcoded FAST channels.

## Quick Start

To spin up a Schedule Service and FAST Channel Engine.

```bash
curl -SL https://github.com/Eyevinn/docker-fast/releases/download/v0.1.0/docker-compose.yml | docker-compose up
```

A demo channel called `eyevinn` is created by default. To get the schedule for a specific date `YYYY-MM-DD`.

```bash
curl -X 'GET' \
  'http://localhost:8080/api/v1/channels/eyevinn/schedule?date=YYYY-MM-DD' \
  -H 'accept: application/json'
```

And to play the channel direct your HLS video player to the URL [http://localhost:8000/channels/eyevinn/master.m3u8](http://web.player.eyevinn.technology/?manifest=http%3A%2F%2Flocalhost%3A8000%2Fchannels%2Feyevinn%2Fmaster.m3u8)

You might need to wait a few minutes first for the channel to be ready.

## Installation

To startup an engine that connects to an online Demo instance of the Eyevinn Schedule Service.

```
docker run -d -p 8000:8000 \
  -e FAST_PLUGIN=ScheduleService \
  eyevinntechnology/fast-engine
```

Connect with your own instance of the Eyevinn Schedule Service.

```
docker run -d -p 8000:8000 \
  -e FAST_PLUGIN=ScheduleService \
  -e SCHEDULE_SERVICE_API_URL=<your-schedule-service-api-url> \
  eyevinntechnology/fast-engine
```

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
