from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from .models import Project
from .views import sanitize_portfolio_code

User = get_user_model()


class ProjectApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="testpass123",
            email_verify=True,
        )
        self.other_user = User.objects.create_user(
            username="bob",
            email="bob@example.com",
            password="testpass123",
            email_verify=True,
        )
        self.client.force_authenticate(user=self.user)

    def upload_file(self, name="landing.html", content=b"<!doctype html><title>Hello</title><h1>Hello</h1>"):
        return SimpleUploadedFile(name, content, content_type="text/html")

    def test_user_can_create_project_by_uploading_html_file(self):
        response = self.client.post(
            "/api/portfolio/projects/",
            {"title": "Team Landing", "html_file": self.upload_file()},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = Project.objects.get(owner=self.user)
        self.assertEqual(project.title, "Team Landing")
        self.assertEqual(project.status, Project.Status.DRAFT)
        self.assertEqual(project.original_filename, "landing.html")
        self.assertIn("<h1>Hello</h1>", project.sanitized_html)
        self.assertTrue(project.slug)

    def test_user_can_create_project_from_uploaded_html_content(self):
        response = self.client.post(
            "/api/portfolio/projects/",
            {
                "title": "Profile Dashboard",
                "html_content": "<!doctype html><title>Dashboard</title><h1>画像</h1>",
                "original_filename": "dashboard.html",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = Project.objects.get(owner=self.user)
        self.assertEqual(project.original_filename, "dashboard.html")
        self.assertEqual(project.file_size, len(project.raw_html.encode("utf-8")))
        self.assertIn("<h1>画像</h1>", project.sanitized_html)

    def test_project_slugs_are_not_sequentially_guessable(self):
        first = Project.objects.create(
            owner=self.user,
            title="Page",
            raw_html="<h1>First</h1>",
            sanitized_html="<h1>First</h1>",
            original_filename="first.html",
        )
        second = Project.objects.create(
            owner=self.user,
            title="Page",
            raw_html="<h1>Second</h1>",
            sanitized_html="<h1>Second</h1>",
            original_filename="second.html",
        )

        self.assertRegex(first.slug, r"^page-[0-9a-f]{8}$")
        self.assertRegex(second.slug, r"^page-[0-9a-f]{8}$")
        self.assertNotEqual(first.slug, second.slug)
        self.assertNotRegex(second.slug, r"^page-\d+$")

    def test_rejects_non_html_uploads(self):
        response = self.client.post(
            "/api/portfolio/projects/",
            {
                "title": "Bad Upload",
                "html_file": SimpleUploadedFile("notes.txt", b"not html", content_type="text/plain"),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Project.objects.count(), 0)

    def test_user_only_sees_their_own_projects(self):
        own = Project.objects.create(
            owner=self.user,
            title="Mine",
            raw_html="<h1>Mine</h1>",
            sanitized_html="<h1>Mine</h1>",
            original_filename="mine.html",
        )
        Project.objects.create(
            owner=self.other_user,
            title="Theirs",
            raw_html="<h1>Theirs</h1>",
            sanitized_html="<h1>Theirs</h1>",
            original_filename="theirs.html",
        )

        response = self.client.get("/api/portfolio/projects/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertEqual(ids, [own.id])

    def test_user_cannot_access_another_users_project(self):
        other_project = Project.objects.create(
            owner=self.other_user,
            title="Secret",
            raw_html="<h1>Secret</h1>",
            sanitized_html="<h1>Secret</h1>",
            original_filename="secret.html",
        )

        response = self.client.get(f"/api/portfolio/projects/{other_project.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_publish_makes_project_public_by_slug(self):
        project = Project.objects.create(
            owner=self.user,
            title="Public Demo",
            raw_html="<!doctype html><title>Demo</title><h1>Public</h1>",
            sanitized_html="<!doctype html><title>Demo</title><h1>Public</h1>",
            original_filename="demo.html",
        )

        publish_response = self.client.post(f"/api/portfolio/projects/{project.id}/publish/")
        self.assertEqual(publish_response.status_code, status.HTTP_200_OK)

        public_response = self.client.get(f"/api/portfolio/p/{project.slug}/")
        self.assertEqual(public_response.status_code, status.HTTP_200_OK)
        self.assertIn("<h1>Public</h1>", public_response.data["html"])

    def test_public_project_preserves_inline_data_images(self):
        inline_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD"
        html = f'<!doctype html><img class="aha-chat-shot" src="{inline_image}" alt="AHA chat">'
        create_response = self.client.post(
            "/api/portfolio/projects/",
            {
                "title": "Inline Image Demo",
                "html_content": html,
                "original_filename": "inline-image.html",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        project = Project.objects.get(title="Inline Image Demo")
        self.client.post(f"/api/portfolio/projects/{project.id}/publish/")
        public_response = self.client.get(f"/api/portfolio/p/{project.slug}/")

        self.assertEqual(public_response.status_code, status.HTTP_200_OK)
        self.assertIn(inline_image, public_response.data["html"])

    def test_draft_project_is_not_public(self):
        project = Project.objects.create(
            owner=self.user,
            title="Draft",
            raw_html="<h1>Draft</h1>",
            sanitized_html="<h1>Draft</h1>",
            original_filename="draft.html",
        )

        response = self.client.get(f"/api/portfolio/p/{project.slug}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SimpleAuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_registered_user_can_login_without_email_verification(self):
        register_response = self.client.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "new@example.com",
                "password": "testpass123",
                "password2": "testpass123",
            },
            format="json",
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)

        login_response = self.client.post(
            "/api/auth/login/",
            {"username": "new@example.com", "password": "testpass123"},
            format="json",
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)


class SanitizationTestCase(TestCase):
    def test_event_handler_and_javascript_protocol_are_removed(self):
        malicious_code = '<a href="javascript:alert(1)" onclick="alert(2)">Link</a>'

        sanitized, log = sanitize_portfolio_code(malicious_code)

        self.assertNotIn("javascript:", sanitized.lower())
        self.assertNotIn("onclick", sanitized.lower())
        self.assertTrue(log)
