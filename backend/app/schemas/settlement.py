from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from decimal import Decimal
from typing import List

class UserBalanceReport(BaseModel):
    user_id: UUID
    user_name: str
    total_paid: Decimal = Field(..., ge=0, decimal_places=2, examples=[120.00])
    total_consumed: Decimal = Field(..., ge=0, decimal_places=2, examples=[30.00])
    net_balance: Decimal = Field(..., decimal_places=2, examples=[90.00])

    model_config = ConfigDict(from_attributes=True)

class SettlementTransaction(BaseModel):
    from_user_id: UUID
    from_user_name: str
    to_user_id: UUID
    to_user_name: str
    amount: Decimal = Field(..., gt=0, decimal_places=2, examples=[30.00])

    model_config = ConfigDict(from_attributes=True)

class SettlementReport(BaseModel):
    billing_cycle: str = Field(..., pattern="^[0-9]{4}-[0-9]{2}$")
    balances: List[UserBalanceReport]
    transactions: List[SettlementTransaction]

    model_config = ConfigDict(from_attributes=True)
