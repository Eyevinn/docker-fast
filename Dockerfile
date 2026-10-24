## Build stage on the full node image (includes make, gcc, g++ and patch
## needed for native modules and the parcel UI build)
FROM node:24 AS build

ADD . /src
WORKDIR /src
RUN npm install
RUN npm run build
RUN npm run build:ui

FROM node:24-slim

WORKDIR /app
COPY --from=build /src/dist ./dist
COPY --from=build /src/package.json ./
RUN npm install --omit=dev

ENTRYPOINT [ "npm", "start" ]
