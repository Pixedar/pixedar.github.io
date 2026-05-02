FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:99 \
    LIBGL_ALWAYS_SOFTWARE=1 \
    MESA_GL_VERSION_OVERRIDE=3.3 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libegl1 \
    libgl1 \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libglu1-mesa \
    libsm6 \
    libx11-6 \
    libxext6 \
    libxrender1 \
    libxt6 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/mindVisualizer
COPY . /app/mindVisualizer

RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install \
      numpy scipy vtk \
      langchain langchain-openai langchain-community \
      faiss-cpu python-dotenv certifi tiktoken openai \
      brainglobe-atlasapi nibabel nilearn scikit-image \
      trame trame-vtk trame-vuetify && \
    chmod +x /app/mindVisualizer/start.sh

EXPOSE 7860

CMD ["/app/mindVisualizer/start.sh"]
