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

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Copy built frontend assets from Stage 1
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

# Expose port (Hugging Face expects 7860 or we can use 8000)
# Hugging Face Spaces default is 7860, but it can adapt. Let's use 8000.
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

