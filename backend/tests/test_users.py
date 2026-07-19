import pytest
from fastapi.testclient import TestClient

def test_create_user(client: TestClient):
    response = client.post(
        "/api/v1/users/",
        json={"name": "Alice Smith", "email": "alice@example.com", "pix_key": "alice-pix", "avatar_url": "https://alice.com/avatar.png"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice Smith"
    assert data["email"] == "alice@example.com"
    assert data["pix_key"] == "alice-pix"
    assert data["avatar_url"] == "https://alice.com/avatar.png"
    assert "id" in data
    assert "created_at" in data

def test_create_duplicate_email(client: TestClient):
    # Create first user
    client.post(
        "/api/v1/users/",
        json={"name": "Bob", "email": "bob@example.com"}
    )
    # Attempt duplicate email
    response = client.post(
        "/api/v1/users/",
        json={"name": "Bobby", "email": "bob@example.com"}
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

def test_get_user(client: TestClient):
    create_resp = client.post(
        "/api/v1/users/",
        json={"name": "Charlie", "email": "charlie@example.com"}
    )
    user_id = create_resp.json()["id"]

    # Fetch user
    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Charlie"
    assert data["email"] == "charlie@example.com"

def test_get_nonexistent_user(client: TestClient):
    response = client.get("/api/v1/users/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404

def test_update_user(client: TestClient):
    create_resp = client.post(
        "/api/v1/users/",
        json={"name": "Diana", "email": "diana@example.com"}
    )
    user_id = create_resp.json()["id"]

    # Update name, PIX key and avatar_url
    response = client.put(
        f"/api/v1/users/{user_id}",
        json={"name": "Diana Prince", "pix_key": "diana-pix", "avatar_url": "https://diana.com/avatar.png"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Diana Prince"
    assert data["pix_key"] == "diana-pix"
    assert data["avatar_url"] == "https://diana.com/avatar.png"
    assert data["email"] == "diana@example.com" # unchanged

def test_delete_user(client: TestClient):
    create_resp = client.post(
        "/api/v1/users/",
        json={"name": "Ethan", "email": "ethan@example.com"}
    )
    user_id = create_resp.json()["id"]

    # Delete user
    response = client.delete(f"/api/v1/users/{user_id}")
    assert response.status_code == 204

    # Verify deleted
    get_resp = client.get(f"/api/v1/users/{user_id}")
    assert get_resp.status_code == 404
