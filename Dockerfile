FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/

# Full frontend — all JS modules (explicit list ensures nothing is missed in Docker builds)
COPY index.html favicon.svg ./
COPY admin-persistence.js api.js app.js bulk-actions.js custom-reports.js database-tools.js ./
COPY fleet-map.js fleet-orders.js fleet-vehicle-spec.js freight-admin-settings.js help-assistant.js ./
COPY helpdesk.js internal-communication.js live-operations.js process-guide.js route-catalog.js ./
COPY soft-delete.js themes.js trip-scheduler.js ./
COPY docs/ ./docs/
COPY samples/ ./samples/

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
