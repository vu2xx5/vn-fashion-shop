"""
Dich vu email - gui email xac nhan don hang, dat lai mat khau.
Su dung Celery tasks de gui bat dong bo.
"""

import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def send_order_confirmation(order: Any, user: Any) -> None:
    """
    Gui email xac nhan don hang.
    Dispatch Celery task de gui bat dong bo.
    """
    from app.tasks.email_tasks import send_email_task

    subject = f"Xac nhan don hang #{order.id} - {settings.APP_NAME}"
    body_html = _render_order_confirmation_html(order, user)

    send_email_task.delay(
        to_email=user.email,
        to_name=user.full_name,
        subject=subject,
        body_html=body_html,
    )
    logger.info("Da dispatch email xac nhan don hang #%s cho %s", order.id, user.email)


def send_password_reset(user: Any, token: str) -> None:
    """
    Gui email dat lai mat khau.
    Dispatch Celery task de gui bat dong bo.
    """
    from app.tasks.email_tasks import send_email_task

    reset_url = f"{settings.ALLOWED_ORIGINS[0]}/reset-password?token={token}"
    subject = f"Dat lai mat khau - {settings.APP_NAME}"
    body_html = _render_password_reset_html(user, reset_url)

    send_email_task.delay(
        to_email=user.email,
        to_name=user.full_name,
        subject=subject,
        body_html=body_html,
    )
    logger.info("Da dispatch email dat lai mat khau cho %s", user.email)


def send_order_status_update(order: Any, user: Any, new_status: str) -> None:
    """Gui email thong bao cap nhat trang thai don hang."""
    from app.tasks.email_tasks import send_email_task

    status_labels = {
        "pending": "Cho xu ly",
        "paid": "Da thanh toan",
        "shipped": "Dang giao hang",
        "delivered": "Da giao hang",
        "cancelled": "Da huy",
    }
    status_text = status_labels.get(new_status, new_status)

    subject = f"Don hang #{order.id} - {status_text} | {settings.APP_NAME}"
    body_html = _render_status_update_html(order, user, status_text)

    send_email_task.delay(
        to_email=user.email,
        to_name=user.full_name,
        subject=subject,
        body_html=body_html,
    )


# ---------- HTML Templates ----------


def _render_order_confirmation_html(order: Any, user: Any) -> str:
    """Render HTML email xac nhan don hang."""
    items_html = ""
    if hasattr(order, "items"):
        for item in order.items:
            line_total = item.quantity * item.unit_price
            items_html += f"""
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                    {item.product_name} ({item.variant_info})
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                    {item.quantity}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                    {_format_vnd(line_total)}
                </td>
            </tr>
            """

    # Shipping address la JSONB dict
    addr = order.shipping_address or {}
    addr_name = addr.get("full_name", "")
    addr_phone = addr.get("phone", "")
    addr_street = addr.get("street", "")
    addr_ward = addr.get("ward", "")
    addr_district = addr.get("district", "")
    addr_city = addr.get("city", "")

    return f"""
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Xac nhan don hang #{order.order_number}</h2>
        <p>Xin chao {user.full_name},</p>
        <p>Cam on ban da dat hang tai {settings.APP_NAME}. Don hang cua ban da duoc tiep nhan.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="padding: 8px; text-align: left;">San pham</th>
                    <th style="padding: 8px; text-align: center;">SL</th>
                    <th style="padding: 8px; text-align: right;">Thanh tien</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>

        <div style="text-align: right; margin-top: 10px;">
            <p>Tam tinh: <strong>{_format_vnd(order.subtotal)}</strong></p>
            <p>Phi van chuyen: <strong>{_format_vnd(order.shipping_fee)}</strong></p>
            <p style="font-size: 18px;">Tong cong: <strong style="color: #e53e3e;">
                {_format_vnd(order.total)}</strong></p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
            <h3>Dia chi giao hang</h3>
            <p>{addr_name}<br/>
               {addr_phone}<br/>
               {addr_street}, {addr_ward}<br/>
               {addr_district}, {addr_city}</p>
        </div>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Neu ban co bat ky thac mac nao, vui long lien he voi chung toi.
        </p>
    </div>
    """


def _render_password_reset_html(user: Any, reset_url: str) -> str:
    """Render HTML email dat lai mat khau."""
    return f"""
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Dat lai mat khau</h2>
        <p>Xin chao {user.full_name},</p>
        <p>Chung toi nhan duoc yeu cau dat lai mat khau cho tai khoan cua ban.</p>
        <p>Nhan vao nut ben duoi de dat lai mat khau:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}"
               style="background: #e53e3e; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-size: 16px;">
                Dat lai mat khau
            </a>
        </p>
        <p style="color: #666; font-size: 12px;">
            Lien ket nay se het han sau 1 gio.
            Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.
        </p>
    </div>
    """


def _render_status_update_html(order: Any, user: Any, status_text: str) -> str:
    """Render HTML email cap nhat trang thai."""
    return f"""
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Cap nhat don hang #{order.id}</h2>
        <p>Xin chao {user.full_name},</p>
        <p>Don hang <strong>#{order.id}</strong> cua ban da duoc cap nhat
           trang thai: <strong>{status_text}</strong>.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Cam on ban da mua sam tai {settings.APP_NAME}.
        </p>
    </div>
    """


def _format_vnd(amount: int) -> str:
    """Format so tien VND."""
    return f"{amount:,.0f} VND".replace(",", ".")
