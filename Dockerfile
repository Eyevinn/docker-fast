FROM node:16-slim

ADD . /app
WORKDIR /app

RUN npm install
RUN npm run build
RUN npm run build:ui

ENTRYPOINT [ "npm", "start" ]