import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
from decimal import Decimal

@pytest.fixture
def create_test_users(client: TestClient):
    u1 = client.post("/api/v1/users/", json={"name": "User A", "email": "a@test.com", "pix_key": "pixA"}).json()
    u2 = client.post("/api/v1/users/", json={"name": "User B", "email": "b@test.com", "pix_key": "pixB"}).json()
    u3 = client.post("/api/v1/users/", json={"name": "User C", "email": "c@test.com", "pix_key": "pixC"}).json()
    return u1, u2, u3

def test_create_installment_expense_rounding(client: TestClient, create_test_users):
    u1, u2, u3 = create_test_users
    
    # Create an installment expense of 100.00 split over 3 months
    payload = {
        "title": "MacBook",
        "total_amount": 100.00,
        "payer_id": u1["id"],
        "expense_type": "Installment",
        "billing_cycle": "2026-06",
        "total_installments": 3,
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0},
            {"user_id": u3["id"], "weight": 1.0}
        ]
    }
    
    response = client.post("/api/v1/expenses/", json=payload)
    assert response.status_code == 201
    first_inst = response.json()
    
    assert first_inst["title"] == "MacBook (1/3)"
    assert float(first_inst["total_amount"]) == 33.33
    assert first_inst["installment_number"] == 1
    assert first_inst["total_installments"] == 3
    assert first_inst["parent_installment_id"] is not None
    parent_id = first_inst["parent_installment_id"]
    
    # Query all expenses for the generated cycles
    e1_resp = client.get("/api/v1/expenses/?billing_cycle=2026-06")
    e2_resp = client.get("/api/v1/expenses/?billing_cycle=2026-07")
    e3_resp = client.get("/api/v1/expenses/?billing_cycle=2026-08")
    
    assert e1_resp.status_code == 200
    assert e2_resp.status_code == 200
    assert e3_resp.status_code == 200
    
    inst1 = next(e for e in e1_resp.json() if e["parent_installment_id"] == parent_id)
    inst2 = next(e for e in e2_resp.json() if e["parent_installment_id"] == parent_id)
    inst3 = next(e for e in e3_resp.json() if e["parent_installment_id"] == parent_id)
    
    assert inst1["installment_number"] == 1
    assert inst2["installment_number"] == 2
    assert inst3["installment_number"] == 3
    
    # Verify the rounding corrections: 33.33, 33.33, 33.34
    assert float(inst1["total_amount"]) == 33.33
    assert float(inst2["total_amount"]) == 33.33
    assert float(inst3["total_amount"]) == 33.34
    
    # Sum must equal 100.00
    total_sum = Decimal(str(inst1["total_amount"])) + Decimal(str(inst2["total_amount"])) + Decimal(str(inst3["total_amount"]))
    assert total_sum == Decimal("100.00")

def test_create_installment_bad_parameters(client: TestClient, create_test_users):
    u1, u2, _ = create_test_users
    
    payload = {
        "title": "Faulty Installment",
        "total_amount": 100.00,
        "payer_id": u1["id"],
        "expense_type": "Installment",
        "billing_cycle": "2026-06",
        # Missing total_installments
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0}
        ]
    }
    
    response = client.post("/api/v1/expenses/", json=payload)
    assert response.status_code == 400
    assert "total_installments must be at least 1" in response.json()["detail"]

def test_delete_installment_group(client: TestClient, create_test_users):
    u1, u2, _ = create_test_users
    
    payload = {
        "title": "Phone",
        "total_amount": 120.00,
        "payer_id": u1["id"],
        "expense_type": "Installment",
        "billing_cycle": "2026-06",
        "total_installments": 2,
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0}
        ]
    }
    
    first_inst = client.post("/api/v1/expenses/", json=payload).json()
    parent_id = first_inst["parent_installment_id"]
    
    # Check that both siblings exist
    all_expenses = client.get("/api/v1/expenses/").json()
    siblings = [e for e in all_expenses if e.get("parent_installment_id") == parent_id]
    assert len(siblings) == 2
    
    # Delete group
    del_resp = client.delete(f"/api/v1/expenses/{siblings[0]['id']}?delete_group=true")
    assert del_resp.status_code == 204
    
    # Verify both are gone
    all_expenses_after = client.get("/api/v1/expenses/").json()
    siblings_after = [e for e in all_expenses_after if e.get("parent_installment_id") == parent_id]
    assert len(siblings_after) == 0

def test_delete_installment_single(client: TestClient, create_test_users):
    u1, u2, _ = create_test_users
    
    payload = {
        "title": "TV",
        "total_amount": 200.00,
        "payer_id": u1["id"],
        "expense_type": "Installment",
        "billing_cycle": "2026-06",
        "total_installments": 2,
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0}
        ]
    }
    
    first_inst = client.post("/api/v1/expenses/", json=payload).json()
    parent_id = first_inst["parent_installment_id"]
    
    all_expenses = client.get("/api/v1/expenses/").json()
    siblings = [e for e in all_expenses if e.get("parent_installment_id") == parent_id]
    assert len(siblings) == 2
    
    # Delete single installment (delete_group defaults to false)
    del_resp = client.delete(f"/api/v1/expenses/{siblings[0]['id']}")
    assert del_resp.status_code == 204
    
    # Verify only one is deleted
    all_expenses_after = client.get("/api/v1/expenses/").json()
    siblings_after = [e for e in all_expenses_after if e.get("parent_installment_id") == parent_id]
    assert len(siblings_after) == 1
    assert siblings_after[0]["id"] == siblings[1]["id"]

def test_recurring_template_crud(client: TestClient, create_test_users):
    u1, u2, _ = create_test_users
    
    # Create template
    payload = {
        "title": "Netflix Family",
        "total_amount": 55.90,
        "payer_id": u1["id"],
        "is_active": True,
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0}
        ]
    }
    
    response = client.post("/api/v1/recurring-expenses/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Netflix Family"
    assert float(data["total_amount"]) == 55.90
    assert len(data["participations"]) == 2
    template_id = data["id"]
    
    # List templates
    list_resp = client.get("/api/v1/recurring-expenses/")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1
    
    # Get by ID
    get_resp = client.get(f"/api/v1/recurring-expenses/{template_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Netflix Family"
    
    # Update template
    update_payload = {
        "title": "Netflix Premium",
        "total_amount": 60.00,
        "is_active": False
    }
    upd_resp = client.put(f"/api/v1/recurring-expenses/{template_id}", json=update_payload)
    assert upd_resp.status_code == 200
    assert upd_resp.json()["title"] == "Netflix Premium"
    assert float(upd_resp.json()["total_amount"]) == 60.00
    assert upd_resp.json()["is_active"] is False
    
    # Delete template
    del_resp = client.delete(f"/api/v1/recurring-expenses/{template_id}")
    assert del_resp.status_code == 204
    
    # Check 404
    get_resp_after = client.get(f"/api/v1/recurring-expenses/{template_id}")
    assert get_resp_after.status_code == 404

def test_recurring_template_validation(client: TestClient, create_test_users):
    u1, u2, _ = create_test_users
    
    # Sum of fixed values does not match total_amount
    payload = {
        "title": "Netflix Family",
        "total_amount": 55.90,
        "payer_id": u1["id"],
        "is_active": True,
        "participations": [
            {"user_id": u1["id"], "value": 20.00},
            {"user_id": u2["id"], "value": 20.00}
        ]
    }
    response = client.post("/api/v1/recurring-expenses/", json=payload)
    assert response.status_code == 400
    assert "must equal total expense amount" in response.json()["detail"]

def test_generate_recurring_expenses_and_idempotency(client: TestClient, create_test_users):
    u1, u2, _ = create_test_users
    
    # Create active template
    payload = {
        "title": "Spotify Premium",
        "total_amount": 34.90,
        "payer_id": u1["id"],
        "is_active": True,
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0}
        ]
    }
    tmpl = client.post("/api/v1/recurring-expenses/", json=payload).json()
    
    # Trigger generation
    gen_resp = client.post("/api/v1/recurring-expenses/generate?billing_cycle=2026-06")
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    
    # Find our generated expense
    matching = [e for e in gen_data if e["recurring_expense_id"] == tmpl["id"]]
    assert len(matching) == 1
    generated_exp = matching[0]
    
    assert generated_exp["title"] == "Spotify Premium"
    assert float(generated_exp["total_amount"]) == 34.90
    assert generated_exp["expense_type"] == "Fixed"
    assert generated_exp["billing_cycle"] == "2026-06"
    assert len(generated_exp["participations"]) == 2
    
    # Test Idempotency: Trigger again, it should not generate duplicates
    gen_resp_2 = client.post("/api/v1/recurring-expenses/generate?billing_cycle=2026-06")
    assert gen_resp_2.status_code == 200
    gen_data_2 = gen_resp_2.json()
    
    matching_2 = [e for e in gen_data_2 if e["recurring_expense_id"] == tmpl["id"]]
    assert len(matching_2) == 0
