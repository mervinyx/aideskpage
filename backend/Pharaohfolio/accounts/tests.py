from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .models import EmailLoginCode, User


class EmailCodeAuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        DEFAULT_FROM_EMAIL="webmaster@localhost",
        EMAIL_HOST_USER="imhoteptech1@gmail.com",
    )
    def test_send_email_login_code_creates_code_and_sends_email(self):
        response = self.client.post(
            "/api/auth/email-code/send/",
            {"email": "new@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EmailLoginCode.objects.filter(email="new@example.com").count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("喜播AI网页发布", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].from_email, "imhoteptech1@gmail.com")

    def test_verify_email_login_code_creates_user_and_returns_tokens(self):
        code = EmailLoginCode.objects.create(
            email="new@example.com",
            code="123456",
            expires_at=timezone.now() + timezone.timedelta(minutes=10),
        )

        response = self.client.post(
            "/api/auth/email-code/verify/",
            {"email": "new@example.com", "code": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "new@example.com")
        self.assertTrue(User.objects.filter(email="new@example.com", email_verify=True).exists())
        code.refresh_from_db()
        self.assertTrue(code.used_at)
