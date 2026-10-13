import pytest
from httpx import AsyncClient


class TestHealth:
    async def test_health_check(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "version" in data


class TestAuth:
    async def test_register(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "full_name": "New User",
                "password": "password123",
                "role": "project_developer",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        # Check cookies are set
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user.email,
                "full_name": "Another User",
                "password": "password123",
            },
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    async def test_login_success(self, client: AsyncClient, test_user):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        # Check cookies are set
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    async def test_login_nonexistent_user(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 401

    async def test_get_me(self, client: AsyncClient, auth_headers, test_user):
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name

    async def test_get_me_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_logout(self, client: AsyncClient, auth_headers):
        response = await client.post("/api/v1/auth/logout", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"
        # Check cookies are deleted
        assert "access_token" not in response.cookies or response.cookies["access_token"] == ""

    async def test_refresh_token(self, client: AsyncClient, test_user):
        # First login to get refresh token
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            },
        )
        refresh_token = login_response.cookies.get("refresh_token")
        assert refresh_token

        # Use refresh token
        response = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    async def test_refresh_token_invalid(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": "invalid_token"},
        )
        assert response.status_code == 401