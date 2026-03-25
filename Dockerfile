# Stage 1: Build Frontend
FROM node:18-slim AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Build the production assets
RUN npm run build

# Stage 2: Build Backend and Final Image
FROM python:3.10-slim
WORKDIR /app

# System deps for scientific python wheels (and fallback to source builds)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Ensure pip tooling is modern for dependency builds
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Copy built frontend assets from Stage 1
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

# Expose port (Hugging Face expects 7860 for Docker Spaces)
EXPOSE 7860

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]

