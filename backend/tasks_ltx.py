"""Tâches Celery : génération vidéo LTX après script."""
from backend.celery_app import celery_app


@celery_app.task(name="scripty.ltx_for_script", bind=True, max_retries=0)
def ltx_for_script_task(self, script_id: int) -> None:
    """Exécuté dans le worker Celery (contexte Flask requis)."""
    from backend.app_saas import app

    with app.app_context():
        from backend.ltx_workflow import run_ltx_pipeline_for_script

        run_ltx_pipeline_for_script(int(script_id), pipeline=None, enhance_prompt=True)


def enqueue_ltx_for_script(script_id: int) -> None:
    """Enfile la génération LTX (lève si Celery/Redis indisponible)."""
    ltx_for_script_task.delay(int(script_id))
