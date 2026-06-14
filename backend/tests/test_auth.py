import jwt
from fastapi.testclient import TestClient
from app.config import settings
from app.api.deps import verify_jwt

def test_auth_missing_token(client: TestClient):
    """
    Ensure that a request without the Authorization header returns 401 Unauthorized.
    """
    # Remove the dependency override to test the actual verify_jwt dependency
    if verify_jwt in client.app.dependency_overrides:
        del client.app.dependency_overrides[verify_jwt]
        
    try:
        response = client.get("/api/v1/users/")
        assert response.status_code == 401
        assert response.json()["detail"] == "Authentication credentials are required."
    finally:
        # Restore override for subsequent tests
        def override_verify_jwt():
            return {"sub": "test-user-id", "aud": "authenticated"}
        client.app.dependency_overrides[verify_jwt] = override_verify_jwt


def test_auth_invalid_token(client: TestClient):
    """
    Ensure that an invalid JWT token returns 401 Unauthorized.
    """
    if verify_jwt in client.app.dependency_overrides:
        del client.app.dependency_overrides[verify_jwt]
        
    try:
        headers = {"Authorization": "Bearer invalid.jwt.token"}
        response = client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
    finally:
        # Restore override
        def override_verify_jwt():
            return {"sub": "test-user-id", "aud": "authenticated"}
        client.app.dependency_overrides[verify_jwt] = override_verify_jwt


def test_auth_valid_token(client: TestClient):
    """
    Ensure that a valid JWT token signed with the correct Supabase secret returns a successful request.
    """
    if verify_jwt in client.app.dependency_overrides:
        del client.app.dependency_overrides[verify_jwt]
        
    try:
        # Generate a valid token
        payload = {"sub": "12345678-1234-1234-1234-123456789012", "aud": "authenticated"}
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/users/", headers=headers)
        
        # Should bypass 401 and reach the actual endpoint (which returns 200 OK since users table is empty)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    finally:
        # Restore override
        def override_verify_jwt():
            return {"sub": "test-user-id", "aud": "authenticated"}
        client.app.dependency_overrides[verify_jwt] = override_verify_jwt
