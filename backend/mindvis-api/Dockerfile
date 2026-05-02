FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MINDVIS_REPO=/app/mindVisualizer

WORKDIR /app/api

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libx11-6 \
    libxext6 \
    libxrender1 \
    libsm6 \
    libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY mindVisualizer /app/mindVisualizer

EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
