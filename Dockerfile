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

# Streamlit config
ENV STREAMLIT_SERVER_PORT=8501 \
    STREAMLIT_SERVER_HEADLESS=true \
    STREAMLIT_BROWSER_GATHER_USAGE_STATS=false

EXPOSE 8501

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

CMD ["streamlit", "run", "app.py", \
     "--server.port=8501", \
     "--server.address=0.0.0.0", \
     "--server.headless=true"]
