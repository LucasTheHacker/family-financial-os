from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional
from uuid import UUID
from decimal import Decimal
from app.schemas.user import UserResponse

class ParticipationBase(BaseModel):
    user_id: UUID = Field(..., description="ID of the participating user")
    value: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Exact value share of the expense", examples=[30.00])
    weight: Optional[Decimal] = Field(None, ge=0, decimal_places=4, description="Weight share of the expense", examples=[1.0])

class ParticipationCreate(ParticipationBase):
    @model_validator(mode="after")
    def validate_value_or_weight(self):
        if self.value is None and self.weight is None:
            raise ValueError("Either value or weight must be provided for participation")
        return self

class ParticipationResponse(BaseModel):
    id: UUID
    expense_id: UUID
    user_id: UUID
    value: Optional[Decimal] = None
    weight: Optional[Decimal] = None
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)
