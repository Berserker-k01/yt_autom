import multiprocessing
import os

# Port from environment variable (Render sets PORT)
port = os.environ.get('PORT', '5000')
bind = f"0.0.0.0:{port}"

# Workers configuration for Render
# Use fewer workers on Render free tier to avoid memory issues
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)
worker_class = "sync"
timeout = 120  # 2 minutes
keepalive = 5

# Logging
accesslog = "-"  # log to stdout
errorlog = "-"   # log to stderr
loglevel = "info"

# Graceful timeout
graceful_timeout = 30

# Preload app for better performance
preload_app = True
