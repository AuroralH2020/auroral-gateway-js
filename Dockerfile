FROM node:12-slim as base
LABEL version="1.0"
LABEL maintaner="jorge.almela@bavenir.eu"
LABEL release-date="27-10-2021"
EXPOSE 9876
RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node
COPY --chown=node:node package*.json tsconfig.json ./
COPY --chown=node:node dist ./dist
RUN npm ci && npm cache clean --force
CMD ["node", "./dist/src/app.js"]
