FROM node:10

ARG container_port=8080
ARG json_source
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .
EXPOSE $container_port

ENV APP_PORT=${container_port}
ENV RESPONSE_JSON=${json_source}
CMD yarn start --port=${APP_PORT} --json=${RESPONSE_JSON}
