"""Worker Celery (file d'attente Redis) pour les tâches longues (génération vidéo LTX)."""
import os

from celery import Celery

celery_app = Celery(
    "scripty",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
)

import backend.tasks_ltx  # noqa: E402,F401 — enregistre les tâches
