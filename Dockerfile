# ---------- Base image ----------
FROM node:20-alpine AS base
WORKDIR /app

# ---------- Development image ----------
FROM base AS dev

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --ignore-engines

# Copy source
COPY . .

# Ensure start script is executable (used in docs)
RUN chmod +x ./start.sh

# Expose dev ports (API + Admin/Vite)
EXPOSE 9000 5173

# Default to development
ENV NODE_ENV=development

# Start: run migrations, seed, then dev server (per docs)
CMD ["./start.sh"]

# ---------- Production build image ----------
FROM base AS build

# Install dependencies for building
COPY package.json yarn.lock ./
RUN yarn install --ignore-engines

# Copy source
COPY . .

# Build Medusa production bundle -> .medusa/server
RUN yarn medusa build

# ---------- Production runtime image ----------
FROM base AS prod

# Copy built server
COPY --from=build /app/.medusa/server /app

WORKDIR /app

# Install runtime deps inside .medusa/server
RUN yarn install --ignore-engines

# Expose production API port
EXPOSE 9000

# Production env
ENV NODE_ENV=production

# Start command recommended in deployment docs:
# run migrations (predeploy) then start
CMD ["sh", "-c", "yarn predeploy && yarn run start"]
