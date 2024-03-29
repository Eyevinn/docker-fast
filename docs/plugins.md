Specify plugin to use by setting the `FAST_PLUGIN` environment variable, e.g.

```
docker run -d -p 8000:8000 \
  -e FAST_PLUGIN=ScheduleService \
  -e SCHEDULE_SERVICE_API_URL=<api-url> \
  eyevinntechnology/fast-engine
```

The following plugins are available.

| Plugin          | Desc                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Demo            | Random selection from a pre-defined static list of assets                                                     |
| ScheduleService | Fetches schedule and channels from an [Eyevinn Schedule Service](https://github.com/Eyevinn/schedule-service) |
| Loop            | Produce a channel with a single VOD on loop                                                                   |
| Playlist        | Produce a channel based on a playlist txt file                                                                |
| Barker          | Produce a barker channel by switching between live channels a given interval                                  |
| WebHook         | Use a custom webhook to decide what VOD to play next                                                          |

## Demo Plugin Options

- `DEMO_NUM_CHANNELS`: Number of demo channels to create.

## Schedule Service Plugin Options

- `SCHEDULE_SERVICE_API_URL`: URL to Schedule Service API endpoint.

## Loop Plugin Options

- `LOOP_VOD_URL`: URL to the HLS VOD to loop.
- `LOOP_CHANNEL_NAME`: The name of the channel (default `loop`)
- `LOOP_PREROLL_URL`: URL for a preroll to insert before the HLS VOD
- `LOOP_PREROLL_DURATION_MS`: Duration of preroll in milliseconds

Channel with the HLS VOD to loop is then available at `/channels/loop/master.m3u8`

## Playlist Plugin Options

- `PLAYLIST_URL`: URL to the playlist txt file. A txt file where each line contains a URL to a HLS VOD ([example](https://testcontent.eyevinn.technology/fast/fast-playlist.txt))
- `PLAYLIST_CHANNEL_NAME`: The name of the channel (default `playlist`)
- `PLAYLIST_PREROLL_URL`: URL for a preroll to insert before the HLS VOD
- `PLAYLIST_PREROLL_DURATION_MS`: Duration of preroll in milliseconds

To provide a set of playlists the `PLAYLIST_URL` is a comma separated list of channel name and playlist url pairs delimited by a pipe char (`|`): `PLAYLIST_URL="<CHANNEL_NAME1>|<URL1>,<CHANNEL_NAME2>|<URL2>"`. In this case the `PLAYLIST_CHANNEL_NAME` is overriden if set.

## Barker Plugin Options

- `BARKERLIST_URL`: URL to a txt file with list of live HLS streams where each line contains a URL to a HLS LIVE stream ([example](https://testcontent.eyevinn.technology/fast/barkertest.txt))
- `BARKER_CHANNEL_NAME`: The name of the channel (default `barker`)
- `SWITCH_INTERVAL_SEC`: How often it should switch between the streams (default 60 sec)

## WebHook Plugin Options

- `WEBHOOK_URL`: URL to the custom webhook, default is `http://localhost:8002/nextVod`
- `WEBHOOK_CHANNEL_NAME`: The name of the channel (default `hls`)
- `OPTS_WEBHOOK_APIKEY`: When set the `Authorization` header will be set to `Bearer <OPTS_WEBHOOK_APIKEY>` on the HTTP request to the webhook

An example of a webhook and how this plugin can be used can be found [here](plugins/webhook.md).
