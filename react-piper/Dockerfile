FROM node:19.2.0-alpine3.15 AS build

WORKDIR /
COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

ARG SPECS_URL
ENV SPECS_URL=$SPECS_URL

RUN yarn build

FROM nginx:1.23.2-alpine

COPY --from=build /build/ /usr/share/nginx/html/

