# Stage 1: Build
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY . .
RUN npm ci
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npx prisma generate --schema=packages/infrastructure/prisma/schema.prisma
RUN npm run build -w @carbon-tracker/shared-types && \
    npm run build -w @carbon-tracker/domain && \
    npm run build -w @carbon-tracker/application && \
    npm run build -w @carbon-tracker/infrastructure && \
    npm run build -w @carbon-tracker/web

# Stage 2: Nginx on Alpine (Lightweight for static assets)
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
