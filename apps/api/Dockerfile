# Stage 1: Build
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npx prisma generate --schema=packages/infrastructure/prisma/schema.prisma
RUN npm run build -w @carbon-tracker/shared-types && \
    npm run build -w @carbon-tracker/domain && \
    npm run build -w @carbon-tracker/application && \
    npm run build -w @carbon-tracker/infrastructure && \
    npm run build -w @carbon-tracker/api

# Stage 2: Distroless Runtime
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
EXPOSE 3001
CMD ["apps/api/dist/index.js"]
