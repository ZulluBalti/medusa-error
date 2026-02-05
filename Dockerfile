# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# Install deps (cached)
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# -------------------------
# DEV target
# -------------------------
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 9000 5173
# Change this if your repo uses a different dev script (e.g. start:dev, develop, etc.)
CMD ["yarn", "dev"]

# -------------------------
# BUILD target
# -------------------------
FROM base AS build
ENV NODE_ENV=production
# Build Medusa bundle (creates .medusa/server + .medusa/admin)
RUN yarn build

# -------------------------
# PROD runtime target
# -------------------------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Copy only what production needs
COPY --from=build /app/.medusa /app/.medusa
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/yarn.lock /app/yarn.lock
COPY --from=build /app/.yarnrc.yml /app/.yarnrc.yml


# Ensure runtime deps exist (safe even if redundant)
RUN yarn install --frozen-lockfile --production=false || true

WORKDIR /app/.medusa/server
EXPOSE 9000
CMD ["yarn", "start"]
