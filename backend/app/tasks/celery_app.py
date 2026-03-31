"""
Cau hinh Celery voi Redis broker.

Chay worker:
    celery -A app.tasks.celery_app worker --loglevel=info
"""

from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "vn_fashion_shop",
    broker=settings.celery_broker,
    backend=settings.celery_backend,
)

celery_app.conf.update(
    # Dinh dang serialize
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,

    # Retry / reliability
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,

    # Ket qua het han sau 1 gio
    result_expires=3600,

    # Gioi han thoi gian task
    task_soft_time_limit=300,   # 5 phut
    task_time_limit=600,        # 10 phut

    # Auto-discover tasks trong cac module
    include=[
        "app.tasks.email",
        "app.tasks.email_tasks",
        "app.tasks.image",
    ],
)

# Lich chay dinh ky (neu can)
celery_app.conf.beat_schedule = {
    # Vi du: don dep gio hang het han moi ngay luc 3h sang
    # "cleanup-expired-carts": {
    #     "task": "app.tasks.cleanup.cleanup_expired_carts",
    #     "schedule": crontab(hour=3, minute=0),
    # },
}
