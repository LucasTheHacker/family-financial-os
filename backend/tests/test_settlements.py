import pytest
from decimal import Decimal
from uuid import uuid4
from fastapi.testclient import TestClient
from app.services.debt_simplification import DebtSimplifier

def test_pure_simplification_logic_simple():
    # Setup test balances
    u1, u2, u3 = uuid4(), uuid4(), uuid4()
    balances = {
        u1: Decimal("50.00"),   # Creditor
        u2: Decimal("-30.00"),  # Debtor 1
        u3: Decimal("-20.00")   # Debtor 2
    }
    
    transactions = DebtSimplifier.simplify_debts(balances)
    assert len(transactions) == 2
    
    # Verify transactions content
    t1 = next(t for t in transactions if t["from_user_id"] == u2)
    assert t1["to_user_id"] == u1
    assert t1["amount"] == Decimal("30.00")
    
    t2 = next(t for t in transactions if t["from_user_id"] == u3)
    assert t2["to_user_id"] == u1
    assert t2["amount"] == Decimal("20.00")

def test_pure_simplification_logic_complex():
    u1, u2, u3, u4 = uuid4(), uuid4(), uuid4(), uuid4()
    # A (+60), B (+40), C (-70), D (-30)
    balances = {
        u1: Decimal("60.00"),
        u2: Decimal("40.00"),
        u3: Decimal("-70.00"),
        u4: Decimal("-30.00")
    }
    
    transactions = DebtSimplifier.simplify_debts(balances)
    # The greedy approach:
    # 1. Largest debtor C (-70) vs largest creditor A (+60).
    #    C pays 60 to A. C balance becomes -10, A becomes 0.
    # 2. Next largest debtor D (-30) vs next largest creditor B (+40).
    #    D pays 30 to B. D becomes 0, B becomes +10.
    # 3. Remaining debtor C (-10) vs remaining creditor B (+10).
    #    C pays 10 to B. C becomes 0, B becomes 0.
    # Total transactions = 3
    assert len(transactions) == 3
    
    # Check C owes A 60
    assert any(t for t in transactions if t["from_user_id"] == u3 and t["to_user_id"] == u1 and t["amount"] == Decimal("60.00"))
    # Check D owes B 30
    assert any(t for t in transactions if t["from_user_id"] == u4 and t["to_user_id"] == u2 and t["amount"] == Decimal("30.00"))
    # Check C owes B 10
    assert any(t for t in transactions if t["from_user_id"] == u3 and t["to_user_id"] == u2 and t["amount"] == Decimal("10.00"))

def test_pure_simplification_logic_no_debts():
    u1, u2 = uuid4(), uuid4()
    balances = {
        u1: Decimal("0.00"),
        u2: Decimal("0.00")
    }
    transactions = DebtSimplifier.simplify_debts(balances)
    assert len(transactions) == 0

def test_api_calculate_settlements(client: TestClient):
    # 1. Create 4 users
    u1 = client.post("/api/v1/users/", json={"name": "Alice", "email": "alice@settle.com"}).json()
    u2 = client.post("/api/v1/users/", json={"name": "Bob", "email": "bob@settle.com"}).json()
    u3 = client.post("/api/v1/users/", json={"name": "Charlie", "email": "charlie@settle.com"}).json()
    u4 = client.post("/api/v1/users/", json={"name": "Diana", "email": "diana@settle.com"}).json()
    
    # 2. Create expenses in 2026-05
    # Alice pays 120.00 split equally among Alice, Bob, Charlie, Diana (30 each)
    client.post("/api/v1/expenses/", json={
        "title": "Rent",
        "total_amount": 120.00,
        "payer_id": u1["id"],
        "expense_type": "Single",
        "billing_cycle": "2026-05",
        "participations": [
            {"user_id": u1["id"], "weight": 1.0},
            {"user_id": u2["id"], "weight": 1.0},
            {"user_id": u3["id"], "weight": 1.0},
            {"user_id": u4["id"], "weight": 1.0}
        ]
    })
    
    # Bob pays 40.00 split equally between Bob and Charlie (20 each)
    client.post("/api/v1/expenses/", json={
        "title": "Snacks",
        "total_amount": 40.00,
        "payer_id": u2["id"],
        "expense_type": "Single",
        "billing_cycle": "2026-05",
        "participations": [
            {"user_id": u2["id"], "weight": 1.0},
            {"user_id": u3["id"], "weight": 1.0}
        ]
    })
    
    # 3. Call settlement API
    response = client.get("/api/v1/expenses/settlement?billing_cycle=2026-05")
    assert response.status_code == 200
    data = response.json()
    
    assert data["billing_cycle"] == "2026-05"
    
    # Verify net balances
    # Alice net: 120 - 30 = 90
    bal_alice = next(b for b in data["balances"] if b["user_id"] == u1["id"])
    assert float(bal_alice["net_balance"]) == 90.00
    
    # Bob net: 40 - (30 rent + 20 snacks) = -10
    bal_bob = next(b for b in data["balances"] if b["user_id"] == u2["id"])
    assert float(bal_bob["net_balance"]) == -10.00
    
    # Charlie net: 0 - (30 rent + 20 snacks) = -50
    bal_charlie = next(b for b in data["balances"] if b["user_id"] == u3["id"])
    assert float(bal_charlie["net_balance"]) == -50.00
    
    # Diana net: 0 - 30 rent = -30
    bal_diana = next(b for b in data["balances"] if b["user_id"] == u4["id"])
    assert float(bal_diana["net_balance"]) == -30.00
    
    # Verify transactions
    # Bob owes 10 to Alice, Charlie owes 50 to Alice, Diana owes 30 to Alice
    txs = data["transactions"]
    assert len(txs) == 3
    
    assert any(t for t in txs if t["from_user_id"] == u2["id"] and t["to_user_id"] == u1["id"] and float(t["amount"]) == 10.00)
    assert any(t for t in txs if t["from_user_id"] == u3["id"] and t["to_user_id"] == u1["id"] and float(t["amount"]) == 50.00)
    assert any(t for t in txs if t["from_user_id"] == u4["id"] and t["to_user_id"] == u1["id"] and float(t["amount"]) == 30.00)

def test_api_calculate_settlements_invalid_cycle(client: TestClient):
    response = client.get("/api/v1/expenses/settlement?billing_cycle=2026/05")
    assert response.status_code == 400
    assert "billing_cycle must be in format YYYY-MM" in response.json()["detail"]
