FROM node:12.18.4-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

RUN apk --no-cache add --virtual native-deps curl bash && \
    curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin && \
    yarn install &&\
    yarn cache clean --force &&\
    apk del native-deps

COPY . .
EXPOSE 3000

RUN yarn build:prod
CMD ["yarn", "start:prod"]
