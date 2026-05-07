import secrets
import re
import smtplib

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import EmailLoginCode, User


CODE_TTL_MINUTES = 10


def normalize_email(email):
    return (email or "").strip().lower()


def build_unique_username(email):
    base = re.sub(r"[^A-Za-z0-9_.+-]", "_", email.split("@", 1)[0]) or "user"
    candidate = base[:140]
    suffix = 1
    while User.objects.filter(username=candidate).exists():
        suffix += 1
        candidate = f"{base[:130]}_{suffix}"
    return candidate


def get_email_from_address():
    return settings.EMAIL_HOST_USER or getattr(settings, "DEFAULT_FROM_EMAIL", "")


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email_verify": user.email_verify,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def send_email_login_code(request):
    email = normalize_email(request.data.get("email"))
    if "@" not in email:
        return Response({"error": "请输入有效邮箱"}, status=status.HTTP_400_BAD_REQUEST)

    code = f"{secrets.randbelow(1_000_000):06d}"
    EmailLoginCode.objects.filter(email=email, used_at__isnull=True).update(used_at=timezone.now())
    EmailLoginCode.objects.create(
        email=email,
        code=code,
        expires_at=timezone.now() + timezone.timedelta(minutes=CODE_TTL_MINUTES),
    )

    try:
        send_mail(
            "喜播AI网页发布登录验证码",
            f"你的登录验证码是：{code}。验证码 {CODE_TTL_MINUTES} 分钟内有效，请勿转发给他人。",
            get_email_from_address(),
            [email],
            fail_silently=False,
        )
    except (smtplib.SMTPException, OSError):
        EmailLoginCode.objects.filter(email=email, code=code, used_at__isnull=True).update(used_at=timezone.now())
        return Response({"error": "邮件服务暂时不可用，请稍后重试"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({"message": "验证码已发送"})


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email_login_code(request):
    email = normalize_email(request.data.get("email"))
    code = (request.data.get("code") or "").strip()
    if "@" not in email or len(code) != 6 or not code.isdigit():
        return Response({"error": "请输入邮箱和 6 位验证码"}, status=status.HTTP_400_BAD_REQUEST)

    login_code = EmailLoginCode.objects.filter(email=email, used_at__isnull=True).order_by("-created_at").first()
    if not login_code or not login_code.is_valid or login_code.code != code:
        if login_code:
            login_code.attempts += 1
            login_code.save(update_fields=["attempts"])
        return Response({"error": "验证码无效或已过期"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.create_user(
            username=build_unique_username(email),
            email=email,
            password=None,
            email_verify=True,
        )
        user.set_unusable_password()
        user.save(update_fields=["password", "email_verify"])
    elif not user.email_verify:
        user.email_verify = True
        user.save(update_fields=["email_verify"])

    login_code.used_at = timezone.now()
    login_code.save(update_fields=["used_at"])

    refresh = RefreshToken.for_user(user)
    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": serialize_user(user),
    })
