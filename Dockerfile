FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY index.html app.js api.js live-operations.js ./

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/data
ENV UPLOADS_DIR=/uploads
ENV REQUIRE_AUTH=true

RUN mkdir -p /data /uploads && chmod +x /app/backend/docker-entrypoint.sh

EXPOSE 3001
VOLUME ["/data", "/uploads"]

WORKDIR /app/backend
ENTRYPOINT ["./docker-entrypoint.sh"]
