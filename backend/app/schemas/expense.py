from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from app.schemas.user import UserResponse
from app.schemas.participation import ParticipationCreate, ParticipationResponse

class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    total_amount: Decimal = Field(..., ge=0, decimal_places=2, examples=[120.00])
    date: Optional[datetime] = None
    payer_id: UUID
    expense_type: str = Field(..., description="Must be Single, Fixed, or Installment")
    billing_cycle: str = Field(..., pattern="^[0-9]{4}-[0-9]{2}$", description="Billing cycle in format YYYY-MM")

    @field_validator("expense_type")
    @classmethod
    def validate_expense_type(cls, v: str) -> str:
        valid_types = {"Single", "Fixed", "Installment"}
        if v not in valid_types:
            raise ValueError(f"expense_type must be one of {valid_types}")
        return v

class ExpenseCreate(ExpenseBase):
    total_installments: Optional[int] = Field(None, ge=1, description="Total number of installments (only for Installment expense_type)", examples=[3])
    # In Pydantic V2, min_length is used for lists/arrays as well
    participations: List[ParticipationCreate] = Field(
        ..., 
        min_length=1, 
        description="List of participants involved in this expense"
    )

class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    total_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, examples=[120.00])
    date: Optional[datetime] = None
    payer_id: Optional[UUID] = None
    expense_type: Optional[str] = None
    billing_cycle: Optional[str] = Field(None, pattern="^[0-9]{4}-[0-9]{2}$")
    participations: Optional[List[ParticipationCreate]] = None

    @field_validator("expense_type")
    @classmethod
    def validate_expense_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_types = {"Single", "Fixed", "Installment"}
        if v not in valid_types:
            raise ValueError(f"expense_type must be one of {valid_types}")
        return v

class ExpenseResponse(ExpenseBase):
    id: UUID
    created_at: datetime
    payer: UserResponse
    participations: List[ParticipationResponse]
    installment_number: Optional[int] = None
    total_installments: Optional[int] = None
    parent_installment_id: Optional[UUID] = None
    recurring_expense_id: Optional[UUID] = None

    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True
    )
