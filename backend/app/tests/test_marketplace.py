import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestMarketplace:
    async def test_create_listing(self, client: AsyncClient, auth_headers, admin_auth_headers):
        # First need to create a project, calculation, and issue credits
        # This is a simplified test - in reality you'd need the full flow
        # For now, test the listing creation endpoint validation
        
        # Try to create listing without proper credit (should fail)
        response = await client.post(
            "/api/v1/marketplace/listings",
            json={
                "credit_id": str(uuid4()),
                "quantity": 10.0,
                "price_per_unit": 25.0,
                "currency": "USD",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404  # Credit not found

    async def test_list_listings(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/marketplace/listings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_purchase_nonexistent_listing(self, client: AsyncClient, buyer_auth_headers):
        # Test that purchasing a non-existent listing returns 404
        response = await client.post(
            "/api/v1/marketplace/purchase",
            json={
                "listing_id": str(uuid4()),
                "quantity": 5.0,
                "price_per_unit": 25.0,
                "total_amount": 125.0,
                "currency": "USD",
            },
            headers=buyer_auth_headers,
        )
        assert response.status_code == 404

    async def test_list_transactions(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/marketplace/transactions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)