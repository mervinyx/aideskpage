from django.db import models
from django.utils.text import slugify

from accounts.models import User


class Project(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    raw_html = models.TextField()
    sanitized_html = models.TextField()
    sanitization_log = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.build_unique_slug()
        super().save(*args, **kwargs)

    def build_unique_slug(self):
        base = slugify(self.title)[:140] or "page"
        candidate = base
        suffix = 1
        while Project.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            suffix += 1
            candidate = f"{base}-{suffix}"
        return candidate

    def __str__(self):
        return f"{self.title} ({self.owner.username})"

    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        ordering = ["-updated_at"]
