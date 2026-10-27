# ============================================
# Cloutlab Telegram Bot — production image
# ============================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Системные зависимости для сборки better-sqlite3 / native модулей
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Зависимости
COPY package.json package-lock.json ./
RUN npm ci --omit=dev=false

# Исходники
COPY tsconfig.json ./
COPY src ./src

# Сборка TS → JS
RUN npm run build

# Убираем dev-зависимости из node_modules
RUN npm prune --omit=dev

# ============================================
# Runtime
# ============================================
FROM node:22-bookworm-slim

WORKDIR /app

# tini — корректная обработка SIGTERM (graceful shutdown)
RUN apt-get update && apt-get install -y --no-install-recommends tini \
 && rm -rf /var/lib/apt/lists/*

# Только то, что нужно для запуска
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Папка для SQLite (монтируется томом)
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATA_DIR=/app/data

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]