"""
Task xu ly hinh anh bat dong bo - tao thumbnail, resize, upload S3.
"""

import io
import logging
from pathlib import Path

import boto3
from PIL import Image

from app.config import get_settings
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)
settings = get_settings()

# Kich thuoc thumbnail mac dinh
THUMBNAIL_SIZES = {
    "small": (150, 150),
    "medium": (400, 400),
    "large": (800, 800),
}


def _get_s3_client():
    """Tao S3 client."""
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION,
    )


def _resize_image(image_bytes: bytes, max_size: tuple[int, int]) -> bytes:
    """Resize hinh anh giu ty le, tra ve bytes."""
    img = Image.open(io.BytesIO(image_bytes))

    # Chuyen sang RGB neu la RGBA (cho JPEG)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img.thumbnail(max_size, Image.Resampling.LANCZOS)

    output = io.BytesIO()
    img.save(output, format="JPEG", quality=85, optimize=True)
    output.seek(0)
    return output.read()


@celery_app.task(
    name="generate_thumbnails",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def generate_thumbnails(self, s3_key: str) -> dict[str, str]:
    """
    Tao cac phien ban thumbnail cho mot hinh anh da upload len S3.

    Args:
        s3_key: Duong dan (key) cua hinh anh goc tren S3.
                VD: "products/original/abc123.jpg"

    Returns:
        Dict chua cac S3 key cua thumbnail da tao.
        VD: {"small": "products/thumbs/small/abc123.jpg", ...}
    """
    try:
        s3 = _get_s3_client()

        # Tai hinh anh goc tu S3
        logger.info("Dang tai hinh anh goc: %s", s3_key)
        response = s3.get_object(Bucket=settings.AWS_S3_BUCKET, Key=s3_key)
        original_bytes = response["Body"].read()

        # Lay ten file va duong dan
        key_path = Path(s3_key)
        file_stem = key_path.stem
        file_ext = ".jpg"  # Luan chuyen sang JPEG
        base_dir = str(key_path.parent).replace("/original", "")

        result = {}

        for size_name, dimensions in THUMBNAIL_SIZES.items():
            logger.info(
                "Dang tao thumbnail %s (%dx%d) cho %s",
                size_name,
                dimensions[0],
                dimensions[1],
                s3_key,
            )

            resized_bytes = _resize_image(original_bytes, dimensions)

            thumb_key = f"{base_dir}/thumbs/{size_name}/{file_stem}{file_ext}"

            s3.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=thumb_key,
                Body=resized_bytes,
                ContentType="image/jpeg",
                CacheControl="public, max-age=31536000",
            )

            result[size_name] = thumb_key
            logger.info("Da upload thumbnail: %s", thumb_key)

        logger.info("Hoan thanh tao thumbnail cho %s: %s", s3_key, result)
        return result

    except Exception as exc:
        logger.error("Loi tao thumbnail cho %s: %s", s3_key, exc, exc_info=True)
        raise self.retry(exc=exc)


@celery_app.task(
    name="optimize_image",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def optimize_image(self, s3_key: str, max_width: int = 1200) -> str:
    """
    Toi uu hoa hinh anh - resize va nen de giam dung luong.

    Args:
        s3_key: Duong dan hinh anh tren S3.
        max_width: Chieu rong toi da (pixel).

    Returns:
        S3 key cua hinh anh da toi uu.
    """
    try:
        s3 = _get_s3_client()

        response = s3.get_object(Bucket=settings.AWS_S3_BUCKET, Key=s3_key)
        original_bytes = response["Body"].read()

        img = Image.open(io.BytesIO(original_bytes))

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Chi resize neu lon hon max_width
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        output = io.BytesIO()
        img.save(output, format="JPEG", quality=85, optimize=True)
        output.seek(0)

        optimized_key = s3_key.replace("/original/", "/optimized/")
        if optimized_key == s3_key:
            optimized_key = s3_key  # Ghi de neu khong co /original/

        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=optimized_key,
            Body=output.read(),
            ContentType="image/jpeg",
            CacheControl="public, max-age=31536000",
        )

        logger.info("Da toi uu hinh anh: %s -> %s", s3_key, optimized_key)
        return optimized_key

    except Exception as exc:
        logger.error("Loi toi uu hinh anh %s: %s", s3_key, exc, exc_info=True)
        raise self.retry(exc=exc)
