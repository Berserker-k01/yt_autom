import multiprocessing

bind = "0.0.0.0:$PORT"
workers = multiprocessing.cpu_count() * 2 + 1
timeout = 120  # 2 minutes
accesslog = "-"  # log to stdout
errorlog = "-"   # log to stderr
