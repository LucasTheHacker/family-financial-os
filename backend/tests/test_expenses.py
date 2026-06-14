import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def create_test_users(client: TestClient):
    # Setup users for tests
    u1 = client.post("/api/v1/users/", json={"name": "Alice", "email": "alice@test.com"}).json()
    u2 = client.post("/api/v1/users/", json={"name": "Bob", "email": "bob@test.com"}).json()
    u3 = client.post("/api/v1/users/", json={"name": "Charlie", "email": "charlie@test.com"}).json()
    return u1, u2, u3

def test_create_expense_with_weights(client: TestClient, create_test_users):
    u1, u2, u3 = create_test_users
    
    # Create expense of 100.00 split among Alice and Bob with weights 2 and 3
    payload = {
        "title": "Groceries",
        "total_amount": 100.00,
        "payer_id": u1["id"],
        "expense_type": "Single",
        "billing_cycle": "2026-05",
        "participations": [
            {"user_id": u1["id"], "weight": 2.0},
            {"user_id": u2["id"], "weight": 3.0}
        ]
    }
    
    response = client.post("/api/v1/expenses/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Groceries"
    assert float(data["total_amount"]) == 100.00
    assert data["payer_id"] == u1["id"]
    
    # Query details and verify distributed values
    parts = data["participations"]
    assert len(parts) == 2
    
    # Alice should have 40.00 (2/5 * 100)
    p_alice = next(p for p in parts if p["user_id"] == u1["id"])
    assert float(p_alice["value"]) == 40.00
    
    # Bob should have 60.00 (3/5 * 100)
    p_bob = next(p for p in parts if p["user_id"] == u2["id"])
    assert float(p_bob["value"]) == 60.00

def test_create_expense_uneven_rounding(client: TestClient, create_test_users):
    u1, u2, u3 = create_test_users
    
    # Create expense of 10.00 split equally among Alice, Bob, and Charlie (weights 1, 1, 1)
    payload = {
        "title": "Pizza",
        "total_amount": 10.00,
        "payer_id": u1["id"],
        "expense_type": "Single",
        "billing_cycle": "2026-05",
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0},
            {"user_id": u3["id"], "weight": 1.0}
        ]
    }
    
    response = client.post("/api/v1/expenses/", json=payload)
    assert response.status_code == 201
    parts = response.json()["participations"]
    
    # Sum of values must be exactly 10.00
    # Two participants should get 3.33 and the last (Charlie) should get 3.34 due to rounding adjustment
    values = [float(p["value"]) for p in parts]
    assert sum(values) == 10.00
    assert sorted(values) == [3.33, 3.33, 3.34]

def test_create_expense_with_fixed_values(client: TestClient, create_test_users):
    u1, u2, u3 = create_test_users
    
    # Create expense of 150.00 with fixed values
    payload = {
        "title": "Utilities",
        "total_amount": 150.00,
        "payer_id": u1["id"],
        "expense_type": "Fixed",
        "billing_cycle": "2026-05",
        "participations": [
            {"user_id": u1["id"], "value": 50.00},
            {"user_id": u2["id"], "value": 100.00}
        ]
    }
    
    response = client.post("/api/v1/expenses/", json=payload)
    assert response.status_code == 201
    
    # Fail if sum of fixed values does not match total_amount
    payload_bad = payload.copy()
    payload_bad["total_amount"] = 200.00
    
    response_bad = client.post("/api/v1/expenses/", json=payload_bad)
    assert response_bad.status_code == 400
    assert "must equal total expense amount" in response_bad.json()["detail"]

def test_get_expense_eager_loading(client: TestClient, create_test_users):
    u1, u2, _ = create_test_users
    
    create_resp = client.post("/api/v1/expenses/", json={
        "title": "Internet",
        "total_amount": 60.00,
        "payer_id": u1["id"],
        "expense_type": "Fixed",
        "billing_cycle": "2026-05",
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0}
        ]
    })
    expense_id = create_resp.json()["id"]
    
    # Read expense
    response = client.get(f"/api/v1/expenses/{expense_id}")
    assert response.status_code == 200
    data = response.json()
    
    # Check that payer is eager loaded
    assert "payer" in data
    assert data["payer"]["name"] == "Alice"
    assert data["payer"]["email"] == "alice@test.com"
    
    # Check participations and their embedded user objects
    assert "participations" in data
    assert len(data["participations"]) == 2
    for part in data["participations"]:
        assert "user" in part
        assert part["user"]["name"] in ["Alice", "Bob"]

def test_update_expense(client: TestClient, create_test_users):
    u1, u2, u3 = create_test_users
    
    create_resp = client.post("/api/v1/expenses/", json={
        "title": "Stream services",
        "total_amount": 30.00,
        "payer_id": u1["id"],
        "expense_type": "Fixed",
        "billing_cycle": "2026-05",
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0}
        ]
    })
    expense_id = create_resp.json()["id"]
    
    # Update title, amount and recalculate weights with new participant
    response = client.put(f"/api/v1/expenses/{expense_id}", json={
        "title": "Streaming Services Bundle",
        "total_amount": 45.00,
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0},
            {"user_id": u3["id"], "weight": 1.0}
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Streaming Services Bundle"
    assert float(data["total_amount"]) == 45.00
    assert len(data["participations"]) == 3
    
    # Verify split (15.00 each)
    for part in data["participations"]:
        assert float(part["value"]) == 15.00

def test_delete_expense(client: TestClient, create_test_users):
    u1, u2, _ = create_test_users
    
    create_resp = client.post("/api/v1/expenses/", json={
        "title": "Uber ride",
        "total_amount": 25.00,
        "payer_id": u1["id"],
        "expense_type": "Single",
        "billing_cycle": "2026-05",
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0}
        ]
    })
    expense_id = create_resp.json()["id"]
    
    # Delete it
    response = client.delete(f"/api/v1/expenses/{expense_id}")
    assert response.status_code == 204
    
    # Verify 404
    get_resp = client.get(f"/api/v1/expenses/{expense_id}")
    assert get_resp.status_code == 404
