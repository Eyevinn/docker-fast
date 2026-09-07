The WebHook plugin is useful when you want to create a fully customized experience and channel assembly. When using this plugin you provide the engine with a webhook url, which is an HTTP callback that will be called when the engine is about to decide on what to play next. It provides the channel Id as a query parameter which can be used as a basis for decision.

## Example webhook

A very simple example of a webhook can look like this (example in Typescript):

```javascript
import fastify from 'fastify';
import { uuid } from 'uuidv4';

interface NextVodResponse {
  id: string;
  title: string;
  hlsUrl: string;
  prerollUrl?: string;
  prerollDurationMs?: number;
  bumperUrl?: string;
  bumperDurationMs?: number;
  desiredOffsetMs?: number;
  desiredDurationMs?: number;
}

interface NextVodQuerystring {
  channelId: string;
}

const app = fastify();
app.get<{ Querystring: NextVodQuerystring; Reply: NextVodResponse }>(
  '/nextVod',
  (request, reply) => {
    const channelId = request.query.channelId;
    console.log(`Requesting next VOD for channel ${channelId}`);

    const vodResponse: NextVodResponse = {
      id: uuid(),
      title: 'Example',
      hlsUrl: 'https://testcontent.eyevinn.technology/vinn/cmaf/index.m3u8'
    };
    reply.send(vodResponse);
  }
);

if (require.main === module) {
  app.listen({ port: 8002 }, (err) => {
    if (err) console.error(err);
  });
} else {
  module.exports = app;
}

```

Build and start the webhook above and then start the container with the following options:

```bash
docker run -d -p 8000:8000 \
  -e FAST_PLUGIN=WebHook \
  -e WEBHOOK_URL=http://localhost:8002/nextVod \
  -e WEBHOOK_CHANNEL_NAME=mychannel \
  eyevinntechnology/fast-engine
```

You are then good to go using a custom webhook to control what should be played up next in the channel available at: http://localhost:8000/channels/mychannel/master.m3u8

## Response fields

| Field               | Type      | Description                                           |
| ------------------- | --------- | ----------------------------------------------------- |
| `id`                | `string`  | Unique identifier of the VOD.                         |
| `title`             | `string`  | Title of the VOD.                                     |
| `hlsUrl`            | `string`  | URL to the HLS manifest of the VOD to play next.      |
| `type`              | `string`  | Set to `gap` to insert a gap, otherwise omit.         |
| `prerollUrl`        | `string?` | Optional URL to a preroll to prepend before the VOD.  |
| `prerollDurationMs` | `number?` | Optional duration of the preroll in milliseconds.     |
| `bumperUrl`         | `string?` | Optional URL to a bumper associated with the VOD.     |
| `bumperDurationMs`  | `number?` | Optional duration of the bumper in milliseconds.      |
| `desiredOffsetMs`   | `number?` | Optional start offset into the VOD in milliseconds.   |
| `desiredDurationMs` | `number?` | Optional desired duration of the VOD in milliseconds. |
