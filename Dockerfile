FROM node:16-slim as base
LABEL version="1.0"
LABEL maintaner="jorge.almela@bavenir.eu"
LABEL release-date="17-07-2022"
# Install openssl for generating certificates
RUN apt update && apt install -y openssl


RUN mkdir /gateway && chown -R node:node /gateway
RUN mkdir /gateway/persistance && chown -R node:node /gateway/persistance

WORKDIR /gateway
USER node

COPY --chown=node:node package*.json tsconfig.json ./
COPY --chown=node:node dist ./dist
COPY --chown=node:node keystore/genkeys.sh /gateway/persistance/keystore/
RUN npm ci && npm cache clean --force
CMD ["./dist/src/server.js"]

