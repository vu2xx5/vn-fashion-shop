"""
Task gui email bat dong bo.
"""

import logging

import emails
from emails.template import JinjaTemplate

from app.config import get_settings
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)
settings = get_settings()


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Ham noi bo gui email qua SMTP."""
    if not settings.SMTP_USER:
        logger.warning("SMTP chua duoc cau hinh. Bo qua gui email toi %s", to_email)
        return False

    message = emails.html(
        subject=subject,
        html=html_body,
        mail_from=(settings.EMAIL_FROM_NAME, settings.EMAIL_FROM_ADDRESS),
    )

    smtp_options = {
        "host": settings.SMTP_HOST,
        "port": settings.SMTP_PORT,
        "user": settings.SMTP_USER,
        "password": settings.SMTP_PASSWORD,
        "tls": True,
    }

    response = message.send(to=to_email, smtp=smtp_options)

    if response.status_code not in (250, 251):
        logger.error(
            "Gui email that bai toi %s: status=%s",
            to_email,
            response.status_code,
        )
        return False

    logger.info("Da gui email thanh cong toi %s", to_email)
    return True


@celery_app.task(
    name="send_order_confirmation",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_order_confirmation(self, to_email: str, order_data: dict) -> bool:
    """
    Gui email xac nhan don hang.

    Args:
        to_email: Dia chi email nguoi nhan
        order_data: Thong tin don hang (order_number, total, items, shipping_address)
    """
    try:
        html_template = JinjaTemplate("""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
                <h1>VN Fashion Shop</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Xac nhan don hang #{{ order_number }}</h2>
                <p>Cam on ban da dat hang tai VN Fashion Shop!</p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">San pham</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">SL</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Gia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for item in items %}
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                {{ item.product_name }}<br>
                                <small style="color: #666;">{{ item.variant_info }}</small>
                            </td>
                            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">{{ item.quantity }}</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">{{ "{:,.0f}".format(item.unit_price) }} VND</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>

                <div style="text-align: right; margin: 20px 0;">
                    <p>Tam tinh: <strong>{{ "{:,.0f}".format(subtotal) }} VND</strong></p>
                    <p>Phi van chuyen: <strong>{{ "{:,.0f}".format(shipping_fee) }} VND</strong></p>
                    <p style="font-size: 1.2em;">Tong cong: <strong style="color: #e74c3c;">{{ "{:,.0f}".format(total) }} VND</strong></p>
                </div>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Dia chi giao hang</h3>
                    <p>{{ shipping_address.full_name }} - {{ shipping_address.phone }}</p>
                    <p>{{ shipping_address.street }}, {{ shipping_address.ward }}, {{ shipping_address.district }}, {{ shipping_address.city }}</p>
                </div>

                <p style="color: #888; font-size: 0.9em;">
                    Ban se nhan duoc thong bao khi don hang duoc van chuyen.
                </p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; color: #888; font-size: 0.8em;">
                <p>&copy; VN Fashion Shop. Moi quyen duoc bao luu.</p>
            </div>
        </body>
        </html>
        """)

        html_body = html_template.render(**order_data)
        subject = f"Xac nhan don hang #{order_data['order_number']} - VN Fashion Shop"

        return _send_email(to_email, subject, html_body)

    except Exception as exc:
        logger.error("Loi gui email xac nhan don hang: %s", exc, exc_info=True)
        raise self.retry(exc=exc)


@celery_app.task(
    name="send_order_status_update",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_order_status_update(
    self, to_email: str, order_number: str, new_status: str
) -> bool:
    """Gui email thong bao cap nhat trang thai don hang."""
    status_labels = {
        "pending": "Cho xu ly",
        "paid": "Da thanh toan",
        "shipped": "Dang giao hang",
        "delivered": "Da giao hang",
        "cancelled": "Da huy",
    }
    status_label = status_labels.get(new_status, new_status)

    try:
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
                <h1>VN Fashion Shop</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Cap nhat don hang #{order_number}</h2>
                <p>Trang thai don hang cua ban da duoc cap nhat:</p>
                <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <h3 style="color: #2e7d32; margin: 0;">{status_label}</h3>
                </div>
                <p>Truy cap website de xem chi tiet don hang.</p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; color: #888; font-size: 0.8em;">
                <p>&copy; VN Fashion Shop. Moi quyen duoc bao luu.</p>
            </div>
        </body>
        </html>
        """

        subject = f"Cap nhat don hang #{order_number} - {status_label}"
        return _send_email(to_email, subject, html_body)

    except Exception as exc:
        logger.error("Loi gui email cap nhat trang thai: %s", exc, exc_info=True)
        raise self.retry(exc=exc)
