from sqlalchemy import Column, String, Numeric, DateTime, func, UUID, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    payer = relationship("User", back_populates="recurring_expenses", lazy="joined")
    
    participations = relationship(
        "RecurringParticipation",
        back_populates="recurring_expense",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    generated_expenses = relationship(
        "Expense",
        back_populates="recurring_expense",
        cascade="save-update, merge"
    )
