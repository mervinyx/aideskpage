import json
import logging
import re

import bleach
from bleach.css_sanitizer import CSSSanitizer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from Pharaohfolio.settings import frontend_url
from .models import Project

logger = logging.getLogger(__name__)

MAX_HTML_UPLOAD_BYTES = 5 * 1024 * 1024

ALLOWED_TAGS = [
    "html", "head", "body", "title", "meta", "link", "style", "script",
    "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "a", "img", "ul", "ol", "li", "br", "hr", "strong", "em",
    "b", "i", "u", "section", "article", "header", "footer",
    "nav", "main", "aside", "canvas", "svg", "table", "tr", "td", "th",
    "thead", "tbody", "tfoot", "form", "input", "button", "textarea",
    "select", "option", "label", "small", "blockquote", "pre", "code",
]

ALLOWED_ATTRIBUTES = {
    "*": ["class", "id", "style", "data-*", "aria-*", "role"],
    "a": ["href", "target", "rel"],
    "img": ["src", "alt", "width", "height"],
    "script": ["type"],
    "link": ["rel", "href", "type"],
    "meta": ["charset", "name", "content", "viewport"],
    "input": ["type", "name", "value", "placeholder", "required"],
    "button": ["type"],
    "form": ["action", "method"],
    "canvas": ["width", "height"],
    "svg": ["width", "height", "viewBox", "xmlns"],
}

DANGEROUS_ATTRIBUTES = [
    "onload", "onclick", "onmouseover", "onerror", "onsubmit",
    "onfocus", "onblur", "onchange", "onselect", "onreset",
    "onabort", "onunload", "onresize", "onscroll", "ondblclick",
]

CSS_SANITIZER = CSSSanitizer()


def sanitize_portfolio_code(code):
    sanitization_log = []

    removed_attributes = []
    for attr in DANGEROUS_ATTRIBUTES:
        pattern = re.compile(rf"\s{attr}\s*=\s*[\"'][^\"']*[\"']", re.IGNORECASE)
        matches = pattern.findall(code)
        if matches:
            removed_attributes.extend(matches)
            code = pattern.sub("", code)

    if removed_attributes:
        sanitization_log.append({
            "action": "removed_dangerous_attributes",
            "details": removed_attributes,
            "count": len(removed_attributes),
        })

    js_protocol_matches = re.findall(r"javascript\s*:[^\"'>\s]+", code, re.IGNORECASE)
    if js_protocol_matches:
        code = re.sub(r"javascript\s*:", "", code, flags=re.IGNORECASE)
        sanitization_log.append({
            "action": "removed_javascript_protocols",
            "details": js_protocol_matches,
            "count": len(js_protocol_matches),
        })

    sanitized = bleach.clean(
        code,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=["http", "https", "mailto", "tel", "data"],
        css_sanitizer=CSS_SANITIZER,
        strip=True,
        strip_comments=False,
    )

    return sanitized, sanitization_log


def serialize_project(project, request=None, include_html=False):
    data = {
        "id": project.id,
        "title": project.title,
        "slug": project.slug,
        "status": project.status,
        "original_filename": project.original_filename,
        "file_size": project.file_size,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "published_at": project.published_at,
        "sanitization_log": project.sanitization_log,
        "public_url": f"{frontend_url}/p/{project.slug}",
    }
    if include_html:
        data["html"] = project.sanitized_html
    return data


def validate_html_filename(filename):
    if not filename.lower().endswith((".html", ".htm")):
        raise ValueError("Only .html or .htm files are supported.")


def decode_html_upload(uploaded_file):
    validate_html_filename(uploaded_file.name or "")
    if uploaded_file.size > MAX_HTML_UPLOAD_BYTES:
        raise ValueError("HTML file must be 5MB or smaller.")

    raw_bytes = uploaded_file.read()
    try:
        return raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return raw_bytes.decode("utf-8", errors="replace")


def decode_html_content(html_content, filename):
    validate_html_filename(filename or "")
    raw_bytes = html_content.encode("utf-8")
    if len(raw_bytes) > MAX_HTML_UPLOAD_BYTES:
        raise ValueError("HTML file must be 5MB or smaller.")
    return html_content, len(raw_bytes)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def projects_collection(request):
    if request.method == "GET":
        projects = Project.objects.filter(owner=request.user)
        return Response({"results": [serialize_project(project, request) for project in projects]})

    title = (request.data.get("title") or "").strip()
    html_file = request.FILES.get("html_file")
    html_content = request.data.get("html_content")
    original_filename = request.data.get("original_filename")
    if not title:
        return Response({"error": "Project title is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not html_file and html_content is None:
        return Response({"error": "HTML file is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if html_file:
            raw_html = decode_html_upload(html_file)
            original_filename = html_file.name
            file_size = html_file.size
        else:
            raw_html, file_size = decode_html_content(html_content, original_filename)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    project = Project.objects.create(
        owner=request.user,
        title=title,
        raw_html=raw_html,
        sanitized_html=raw_html,
        sanitization_log=[],
        original_filename=original_filename,
        file_size=file_size,
    )
    return Response(serialize_project(project, request, include_html=True), status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def project_detail(request, project_id):
    project = get_object_or_404(Project, id=project_id, owner=request.user)

    if request.method == "GET":
        return Response(serialize_project(project, request, include_html=True))

    if request.method == "DELETE":
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    title = (request.data.get("title") or project.title).strip()
    html_file = request.FILES.get("html_file")
    html_content = request.data.get("html_content")
    original_filename = request.data.get("original_filename")
    if title:
        project.title = title

    if html_file or html_content is not None:
        try:
            if html_file:
                raw_html = decode_html_upload(html_file)
                original_filename = html_file.name
                file_size = html_file.size
            else:
                raw_html, file_size = decode_html_content(html_content, original_filename)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        project.raw_html = raw_html
        project.sanitized_html = raw_html
        project.sanitization_log = []
        project.original_filename = original_filename
        project.file_size = file_size

    project.save()
    return Response(serialize_project(project, request, include_html=True))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def publish_project(request, project_id):
    project = get_object_or_404(Project, id=project_id, owner=request.user)
    project.status = Project.Status.PUBLISHED
    project.published_at = timezone.now()
    project.save(update_fields=["status", "published_at", "updated_at"])
    return Response(serialize_project(project, request, include_html=True))


@api_view(["GET"])
@permission_classes([AllowAny])
def public_project(request, slug):
    project = get_object_or_404(Project, slug=slug, status=Project.Status.PUBLISHED)
    return Response({
        "title": project.title,
        "slug": project.slug,
        "html": project.sanitized_html,
        "updated_at": project.updated_at,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def csp_report(request):
    try:
        if request.content_type == "application/csp-report":
            report = json.loads(request.body.decode("utf-8"))
            logger.warning("CSP Violation: %s", report)
            return Response({"status": "received"}, status=200)
        return Response({"error": "Invalid content type"}, status=400)
    except Exception as exc:
        logger.error("CSP report error: %s", exc)
        return Response({"error": "Failed to process report"}, status=500)
