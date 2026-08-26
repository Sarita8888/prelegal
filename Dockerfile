FROM node:22-slim AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/app ./app
RUN uv sync --frozen --no-dev

COPY --from=frontend-build /app/out ./static
COPY catalog.json ./catalog.json
COPY field-schemas.json ./field-schemas.json

ENV DB_PATH=/data/app.db
ENV STATIC_DIR=/app/static
ENV CATALOG_PATH=/app/catalog.json
ENV FIELD_SCHEMAS_PATH=/app/field-schemas.json
EXPOSE 8000

CMD ["uv", "run", "--frozen", "--no-dev", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
