FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_INDEX_URL https://mirrors.aliyun.com/pypi/simple/
ENV PIP_TIMEOUT 120

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY Pharaohfolio/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY Pharaohfolio/ /app/

# Copy entrypoint script from backend root
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 8000

# Run entrypoint
ENTRYPOINT ["/entrypoint.sh"]
