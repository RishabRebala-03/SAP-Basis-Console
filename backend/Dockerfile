FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for compiling python modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose server port
EXPOSE 5000

# Set environment defaults
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5000

# Start Flask with gunicorn production server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
