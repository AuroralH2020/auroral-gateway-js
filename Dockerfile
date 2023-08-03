FROM node:16-slim as base
LABEL version="1.0"
LABEL maintaner="jorge.almela@bavenir.eu"
LABEL release-date="17-07-2022"
# Install openssl for generating certificates
RUN mkdir /gateway && chown -R node:node /gateway
RUN mkdir /gateway/persistance && chown -R node:node /gateway/persistance

RUN apt update && apt install -y openssl && apt-get clean 

FROM base as develop

WORKDIR /gateway
COPY --chown=node:node package*.json tsconfig.json ./
COPY --chown=node:node keystore/genkeys.sh /gateway/persistance/keystore/
RUN echo "[]" > /gateway/persistance/events.json

RUN npm ci && npm cache clean --force

FROM develop as release

WORKDIR /gateway
USER node
# COPY --from=develop --chown=node:node /gateway/node_modules /gateway/node_modules
COPY --chown=node:node dist ./dist
RUN rm -rf /gateway/package-lock.json

CMD ["node", "/app/dist/src/server.js"]

