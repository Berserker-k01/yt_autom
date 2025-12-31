FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements (has SaaS deps)
COPY backend/requirements.txt ./requirements_saas.txt

# Install Python dependencies and verify
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements_saas.txt && \
    pip list && \
    python -c "import flask; import flask_jwt_extended; print('SUCCESS: Dependencies verified')"

# Copy all Python source files from root for the main logic
COPY *.py ./

# Copy everything from backend directory into backend/
COPY backend/ ./backend/

# Expose port
EXPOSE 5000

# Command to stay alive for debugging
CMD ["sleep", "infinity"]
