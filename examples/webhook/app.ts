import fastify from 'fastify';
import { uuid } from 'uuidv4';

interface NextVodResponse {
  id: string;
  title: string;
  hlsUrl: string;
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
