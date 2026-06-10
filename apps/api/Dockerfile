# Stage 1: Build
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/domain/package*.json ./packages/domain/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/application/package*.json ./packages/application/
COPY packages/infrastructure/package*.json ./packages/infrastructure/

RUN npm ci

COPY . .
RUN npm run build --workspaces --if-present

# Stage 2: Distroless Runtime
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
EXPOSE 3001
CMD ["apps/api/dist/index.js"]
