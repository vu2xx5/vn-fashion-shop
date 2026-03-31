"""
Celery tasks - xu ly bat dong bo (email, hinh anh, v.v.)
"""

from app.tasks.celery_app import celery_app

__all__ = ["celery_app"]
