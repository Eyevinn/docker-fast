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
| Loop | Produce a channel with a single VOD on loop |

## Demo Plugin Options

- `DEMO_NUM_CHANNELS`: Number of demo channels to create.

## Schedule Service Plugin Options

- `SCHEDULE_SERVICE_API_URL`: URL to Schedule Service API endpoint.

## Loop Plugin Options

- `LOOP_VOD_URL`: URL to the HLS VOD to loop.
- `LOOP_CHANNEL_NAME`: The name of the channel (default `loop`)

Channel with the HLS VOD to loop is then available at `/channels/loop/master.m3u8`
