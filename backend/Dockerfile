# syntax=docker/dockerfile:1
# Бэкенд: Express-прокси на порту 3001, использует канонический парсер
# backend/src/services/receiptParser.js (тот же, что и в Vercel-функции).
#
# Сборка из КОРНЯ репозитория:
#   docker build -f backend/Dockerfile -t receipt-parser-backend .
# (если архитектура нод отличается от вашей машины, добавьте --platform linux/amd64)

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Только runtime-зависимости (express, cors, dotenv) — без dev-зависимостей.
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

EXPOSE 3001
CMD ["node", "src/server.js"]
