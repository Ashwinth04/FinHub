# Multi-stage build for Monte Carlo Risk Engine
FROM python:3.11-slim as builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    pybind11-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY cpp/ ./cpp/
COPY python/ ./python/

# Build the C++ extension
WORKDIR /app/cpp
RUN mkdir build && cd build && \
    cmake .. -G Ninja -DCMAKE_BUILD_TYPE=Release && \
    ninja

# Copy built module to python directory
RUN find build -name "risk_engine_cpp*.so" -exec cp {} ../python/ \;

# Production stage
FROM python:3.11-slim

# Install runtime dependencies
# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy built application from builder stage
COPY --from=builder /app/python/ ./

# Copy any additional files needed
COPY README.md .

# Change ownership to app user
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV OMP_NUM_THREADS=4

# Default command
CMD ["python", "main.py", "--host", "0.0.0.0", "--port", "8000"]