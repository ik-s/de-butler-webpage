# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV CI=true

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

FROM deps AS web-build
RUN npm run build

FROM node:22-bookworm-slim AS api
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    DATABASE_PATH=/data/de-butler.sqlite \
    UPLOAD_ROOT=/uploads

COPY --from=deps /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY server ./server

RUN mkdir -p /data /uploads \
    && chown -R node:node /app /data /uploads

USER node
EXPOSE 3001

CMD ["npm", "run", "start:server"]

FROM caddy:2-alpine AS web

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=web-build /app/dist /srv

EXPOSE 80
