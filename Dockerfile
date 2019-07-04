FROM node:10

ARG container_port=8080
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .
EXPOSE $container_port

ENV APP_PORT=${container_port}
CMD yarn start-standalone --port=${APP_PORT}
