# FAST by Eyevinn Technology

The Sustainable FAST Channel Engine

---

Based on VOD2Live Technology and the open source Eyevinn Channel Engine library you can generate a numerous amounts of FAST channels with a fraction of energy consumption compared to live transcoded FAST channels.

## Installation

To startup an engine that connects to a Demo instance of the Eyevinn Schedule Service.

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
