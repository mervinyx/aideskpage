from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "status", "slug", "original_filename", "updated_at")
    list_filter = ("status", "created_at", "updated_at")
    search_fields = ("title", "owner__username", "owner__email", "slug")
    readonly_fields = ("created_at", "updated_at", "published_at")
