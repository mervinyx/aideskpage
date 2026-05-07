from django.urls import path

from . import views

urlpatterns = [
    path("projects/", views.projects_collection, name="projects_collection"),
    path("projects/<int:project_id>/", views.project_detail, name="project_detail"),
    path("projects/<int:project_id>/publish/", views.publish_project, name="publish_project"),
    path("p/<slug:slug>/", views.public_project, name="public_project"),
    path("csp-report/", views.csp_report, name="csp_report"),
]
