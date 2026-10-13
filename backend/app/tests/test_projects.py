import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestProjects:
    async def test_create_project(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Test Mangrove Project",
                "description": "A test mangrove restoration project",
                "ecosystem_type": "mangrove",
                "country": "India",
                "state_province": "Gujarat",
                "district": "Kutch",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.5,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Mangrove Project"
        assert data["ecosystem_type"] == "mangrove"
        assert data["status"] == "draft"
        assert data["owner_id"] is not None
        return data["id"]

    async def test_create_project_invalid_coordinates(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Test Project",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 100,  # Invalid
                "longitude": 69.67,
                "area_hectares": 100.5,
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_project_invalid_area(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Test Project",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": -10,  # Invalid
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_list_projects(self, client: AsyncClient, auth_headers):
        # Create a project first
        await client.post(
            "/api/v1/projects",
            json={
                "name": "Project 1",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.5,
            },
            headers=auth_headers,
        )

        response = await client.get("/api/v1/projects", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1

    async def test_get_project(self, client: AsyncClient, auth_headers):
        # Create a project
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project to Get",
                "description": "Test",
                "ecosystem_type": "seagrass",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 50.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project_id
        assert data["name"] == "Project to Get"

    async def test_get_project_not_found(self, client: AsyncClient, auth_headers):
        response = await client.get(f"/api/v1/projects/{uuid4()}", headers=auth_headers)
        assert response.status_code == 404

    async def test_update_project_draft(self, client: AsyncClient, auth_headers):
        # Create a project
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project to Update",
                "description": "Original description",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]

        # Update it
        response = await client.patch(
            f"/api/v1/projects/{project_id}",
            json={
                "description": "Updated description",
                "area_hectares": 150.0,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated description"
        assert data["area_hectares"] == 150.0

    async def test_update_project_not_owner(self, client: AsyncClient, auth_headers, admin_auth_headers):
        # Create project as regular user
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "User Project",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]

        # Try to update as admin (should work)
        response = await client.patch(
            f"/api/v1/projects/{project_id}",
            json={"description": "Admin updated"},
            headers=admin_auth_headers,
        )
        assert response.status_code == 200

    async def test_submit_project(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project to Submit",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]

        response = await client.post(
            f"/api/v1/projects/{project_id}/submit",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "submitted"
        assert data["submitted_at"] is not None

    async def test_submit_project_twice(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project to Submit Twice",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]

        # First submit
        await client.post(f"/api/v1/projects/{project_id}/submit", headers=auth_headers)

        # Second submit should fail
        response = await client.post(
            f"/api/v1/projects/{project_id}/submit",
            headers=auth_headers,
        )
        assert response.status_code == 400

    async def test_review_project_approve(self, client: AsyncClient, auth_headers, gov_auth_headers):
        # Create and submit project
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Approval",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]
        await client.post(f"/api/v1/projects/{project_id}/submit", headers=auth_headers)

        # Review as government officer
        response = await client.post(
            f"/api/v1/projects/{project_id}/review",
            json={"status": "approved", "comments": "Looks good"},
            headers=gov_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved"
        assert data["approved_at"] is not None

    async def test_review_project_reject(self, client: AsyncClient, auth_headers, gov_auth_headers):
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Rejection",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]
        await client.post(f"/api/v1/projects/{project_id}/submit", headers=auth_headers)

        response = await client.post(
            f"/api/v1/projects/{project_id}/review",
            json={"status": "rejected", "comments": "Insufficient data"},
            headers=gov_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "rejected"
        assert data["rejected_at"] is not None

    async def test_review_project_changes_requested(self, client: AsyncClient, auth_headers, gov_auth_headers):
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Changes",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]
        await client.post(f"/api/v1/projects/{project_id}/submit", headers=auth_headers)

        response = await client.post(
            f"/api/v1/projects/{project_id}/review",
            json={"status": "changes_requested", "comments": "Need more evidence"},
            headers=gov_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "changes_requested"

    async def test_resubmit_after_changes(self, client: AsyncClient, auth_headers, gov_auth_headers):
        create_response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Project for Resubmit",
                "description": "Test",
                "ecosystem_type": "mangrove",
                "country": "India",
                "latitude": 23.25,
                "longitude": 69.67,
                "area_hectares": 100.0,
            },
            headers=auth_headers,
        )
        project_id = create_response.json()["id"]
        await client.post(f"/api/v1/projects/{project_id}/submit", headers=auth_headers)
        await client.post(
            f"/api/v1/projects/{project_id}/review",
            json={"status": "changes_requested"},
            headers=gov_auth_headers,
        )

        # Update project (now in changes_requested)
        await client.patch(
            f"/api/v1/projects/{project_id}",
            json={"description": "Updated with more details"},
            headers=auth_headers,
        )

        # Resubmit
        response = await client.post(
            f"/api/v1/projects/{project_id}/submit",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "submitted"