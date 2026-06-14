from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from app.schemas.user import UserResponse

class RecurringParticipationCreate(BaseModel):
    user_id: UUID = Field(..., description="ID of the participating user")
    value: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Exact value share of the recurring expense", examples=[30.00])
    weight: Optional[Decimal] = Field(None, ge=0, decimal_places=4, description="Weight share of the recurring expense", examples=[1.0])

    @model_validator(mode="after")
    def validate_value_or_weight(self):
        if self.value is None and self.weight is None:
            raise ValueError("Either value or weight must be provided for participation")
        return self

class RecurringParticipationResponse(BaseModel):
    id: UUID
    recurring_expense_id: UUID
    user_id: UUID
    value: Optional[Decimal] = None
    weight: Optional[Decimal] = None
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)

class RecurringExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    total_amount: Decimal = Field(..., ge=0, decimal_places=2, examples=[120.00])
    payer_id: UUID
    is_active: bool = Field(True, description="Whether the recurring expense is active and should be generated monthly")

class RecurringExpenseCreate(RecurringExpenseBase):
    participations: List[RecurringParticipationCreate] = Field(
        ...,
        min_length=1,
        description="List of participants involved in this recurring expense"
    )

class RecurringExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    total_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, examples=[120.00])
    payer_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    participations: Optional[List[RecurringParticipationCreate]] = None

class RecurringExpenseResponse(RecurringExpenseBase):
    id: UUID
    created_at: datetime
    payer: UserResponse
    participations: List[RecurringParticipationResponse]

    model_config = ConfigDict(from_attributes=True)
