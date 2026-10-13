import pytest
from httpx import AsyncClient
from uuid import uuid4
import io


class TestEvidence:
    async def test_upload_evidence(self, client: AsyncClient, auth_headers):
        # Create project first
        project_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project with Evidence",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = project_response.json()["id"]

        # Upload evidence
        file_content = b"fake image content"
        files = {"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")}
        response = await client.post(
            f"/api/v1/evidence/upload?project_id={project_id}&evidence_type=drone_image",
            files=files,
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] is not None
        assert data["filename"].endswith(".jpg")
        assert data["status"] == "pending"

    async def test_upload_evidence_invalid_type(self, client: AsyncClient, auth_headers):
        project_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Invalid Evidence",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = project_response.json()["id"]

        file_content = b"fake content"
        files = {"file": ("test.exe", io.BytesIO(file_content), "application/x-msdownload")}
        response = await client.post(
            f"/api/v1/evidence/upload?project_id={project_id}&evidence_type=document",
            files=files,
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "File extension not allowed" in response.json()["detail"]

    async def test_upload_evidence_too_large(self, client: AsyncClient, auth_headers):
        project_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Large Evidence",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = project_response.json()["id"]

        # Create file larger than 10MB
        large_content = b"x" * (11 * 1024 * 1024)
        files = {"file": ("large.jpg", io.BytesIO(large_content), "image/jpeg")}
        response = await client.post(
            f"/api/v1/evidence/upload?project_id={project_id}&evidence_type=drone_image",
            files=files,
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "too large" in response.json()["detail"].lower()

    async def test_list_project_evidence(self, client: AsyncClient, auth_headers):
        project_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Evidence List",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = project_response.json()["id"]

        # Upload a couple of files
        for i in range(2):
            file_content = f"content {i}".encode()
            files = {"file": (f"test{i}.jpg", io.BytesIO(file_content), "image/jpeg")}
            await client.post(
                f"/api/v1/evidence/upload?project_id={project_id}&evidence_type=drone_image",
                files=files,
                headers=auth_headers,
            )

        response = await client.get(
            f"/api/v1/evidence/project/{project_id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_get_evidence(self, client: AsyncClient, auth_headers):
        project_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Get Evidence",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = project_response.json()["id"]

        file_content = b"test content"
        files = {"file": ("get_test.jpg", io.BytesIO(file_content), "image/jpeg")}
        upload_response = await client.post(
            f"/api/v1/evidence/upload?project_id={project_id}&evidence_type=field_photo",
            files=files,
            headers=auth_headers,
        )
        evidence_id = upload_response.json()["id"]

        response = await client.get(
            f"/api/v1/evidence/{evidence_id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == evidence_id
        assert data["evidence_type"] == "field_photo"

    async def test_review_evidence(self, client: AsyncClient, auth_headers, gov_auth_headers):
        project_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Evidence Review",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = project_response.json()["id"]

        file_content = b"review test"
        files = {"file": ("review.jpg", io.BytesIO(file_content), "image/jpeg")}
        upload_response = await client.post(
            f"/api/v1/evidence/upload?project_id={project_id}&evidence_type=satellite_image",
            files=files,
            headers=auth_headers,
        )
        evidence_id = upload_response.json()["id"]

        # Review as government officer
        response = await client.post(
            f"/api/v1/evidence/{evidence_id}/review",
            json={"status": "approved", "comments": "Good quality"},
            headers=gov_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved"
        assert data["reviewer_comments"] == "Good quality"

    async def test_download_evidence(self, client: AsyncClient, auth_headers):
        project_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Download",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = project_response.json()["id"]

        file_content = b"download test content"
        files = {"file": ("download.jpg", io.BytesIO(file_content), "image/jpeg")}
        upload_response = await client.post(
            f"/api/v1/evidence/upload?project_id={project_id}&evidence_type=drone_image",
            files=files,
            headers=auth_headers,
        )
        evidence_id = upload_response.json()["id"]

        response = await client.get(
            f"/api/v1/evidence/{evidence_id}/download",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.content == file_content
        assert "attachment" in response.headers.get("content-disposition", "")