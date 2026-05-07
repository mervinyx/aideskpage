from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

# Create your models here.

class User(AbstractUser):
    """
    Base user model for all user types in the system
    """
    
    email_verify = models.BooleanField(default=False, verbose_name="Email Verified")
    
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"


class EmailLoginCode(models.Model):
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now() and self.attempts < 5

    class Meta:
        verbose_name = "Email login code"
        verbose_name_plural = "Email login codes"
        ordering = ["-created_at"]
