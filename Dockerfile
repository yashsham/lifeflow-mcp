FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir fastmcp httpx pydantic uvicorn fastapi

# Copy server code
COPY servers/ ./servers/

# Expose ports for both Remote MCP SSE servers
EXPOSE 8001
EXPOSE 8002

# Default command to run remote currency server
CMD ["python", "-m", "servers.remote_currency"]
