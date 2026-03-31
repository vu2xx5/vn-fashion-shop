"""
Celery tasks gui email bat dong bo.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from celery import Celery

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

celery_app = Celery(
    "vn_fashion_shop",
    broker=settings.celery_broker,
    backend=settings.celery_backend,
)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    broker_connection_retry_on_startup=True,
)


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name="send_email",
)
def send_email_task(
    self,
    to_email: str,
    to_name: str,
    subject: str,
    body_html: str,
) -> dict:
    """
    Gui email qua SMTP.
    Tu dong retry toi da 3 lan neu that bai.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"
        msg["To"] = f"{to_name} <{to_email}>"

        html_part = MIMEText(body_html, "html", "utf-8")
        msg.attach(html_part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(
                settings.EMAIL_FROM_ADDRESS,
                to_email,
                msg.as_string(),
            )

        logger.info("Da gui email '%s' den %s", subject, to_email)
        return {"status": "sent", "to": to_email}

    except Exception as exc:
        logger.error("Loi gui email den %s: %s", to_email, str(exc))
        raise self.retry(exc=exc)
