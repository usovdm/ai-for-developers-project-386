FROM node:24-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_DATABASE_URL=sqlite:////app/data/app.db \
    APP_STATIC_DIR=/app/frontend-dist

WORKDIR /app

COPY backend/ ./backend/
RUN pip install --no-cache-dir ./backend

COPY --from=frontend-builder /app/frontend/dist ./frontend-dist

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}"]
