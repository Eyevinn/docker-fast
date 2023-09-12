# Open Source as a Service (BETA)

This FAST engine is available as Open Source as a Service (in BETA) provided by Eyevinn Technology when you want to quickly try it out and get started. To try it out you just need to follow the following instructions. For more information about Open Source as a Service and pricing contact [sales@eyevinn.se](mailto:sales@eyevinn.se)

In the example belows we are using curl but you can also use the [online API documentation](https://api-ce.stage.osaas.io/docs) instead.

## Create trial-token

Generate a trial-token in our demo environment. The trial-token limits you to maximum of 3 channels and running in our demo environment. Replace `YOUR_ORG` and `YOUR_EMAIL` in the command below.

```bash
curl -X 'POST' \
  'https://api-ce.stage.osaas.io/token' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "company": "YOUR_ORG",
  "email": "YOUR_EMAIL"
}'
```

In return you get a `JWT_TOKEN` that you will be using to create and remove channels.

## Create a channel from looping a VOD

Create a channel by looping a VOD with this command. Replace `JWT_TOKEN` with the the trial-token you generated before.

```bash
curl -X 'POST' \
  'https://api-ce.stage.osaas.io/channel' \
  -H 'accept: application/json' \
  -H 'x-jwt: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "mychannel",
  "type": "Loop",
  "url": "https://testcontent.eyevinn.technology/vinn/cmaf/index.m3u8"
}'
```

### List all your channels

To list all the channels that you have created run the following command. Replace `JWT_TOKEN` with your trial token.

```bash
curl -X 'GET' \
  'https://api-ce.stage.osaas.io/channel' \
  -H 'accept: application/json' \
  -H 'x-jwt: Bearer JWT_TOKEN'
```

In return you should get something like this.

```json
[
  {
    "id": "eyevinn-mychannel",
    "name": "mychannel",
    "type": "Loop",
    "url": "https://eyevinn.ce.stage.osaas.io/channels/mychannel/master.m3u8"
  }
]
```

## Create a channel using a webhook

To create a channel that uses a custom webhook you can run the following command.

```bash
curl -X 'POST' \
  'https://api-ce.stage.osaas.io/channel' \
  -H 'accept: application/json' \
  -H 'x-jwt: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "mychannel",
  "type": "WebHook",
  "url": "https://nextvod.dev.eyevinn.technology"
}'
```

Where you would replace the `https://nextvod.dev.eyevinn.technology` with the URL to your webhook. For more information and example of a webhook read the [webhook-plugin documentation](plugins/webhook.md).

## Remove a channel

To remove a channel you run the following and replace the `eyevinn-mychannel` with the channel id of your channel.

```bash
curl -X 'DELETE' \
  'https://api-ce.stage.osaas.io/eyevinn-mychannel' \
  -H 'accept: application/json' \
  -H 'x-jwt: Bearer JWT_TOKEN'
```
