FROM python:3.11-slim

LABEL maintainer="SugarTech Digital Twin" \
      version="1.0" \
      description="Digital Twin for Sustainable Sugar Industry"

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && rm -rf /var/lib/apt/lists/*

# Python deps first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# App source
COPY . .

# Create data directory
RUN mkdir -p data

# FastAPI config
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "api.py"]
