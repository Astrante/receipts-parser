# syntax=docker/dockerfile:1
# Фронтенд: собираем Vite-приложение и отдаём статику через nginx,
# который проксирует /api на backend-сервис (см. nginx.conf).
#
# Сборка из КОРНЯ репозитория:
#   docker build -f frontend/Dockerfile -t receipt-parser-frontend .
# (если архитектура нод отличается от вашей машины, добавьте --platform linux/amd64)

# ---- сборка SPA ----
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- раздача статики + прокси /api ----
FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
