# Multi-stage build for Stephen Hawking Brain (Production Optimized)
# Supports Any Environment: Cloud Run, On-premise, Multi-Cloud

# Stage 1: Build Frontend
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
# We need tsx to run server.ts directly or compile it.
# Node 23.6+ supports --strip-types, but for Node 20 we'll use tsx or compile.
RUN npm install -g tsx
RUN npm install --omit=dev

EXPOSE 3000
ENV NODE_ENV=production
CMD ["tsx", "server.ts"]
