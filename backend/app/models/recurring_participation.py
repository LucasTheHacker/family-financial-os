from sqlalchemy import Column, Numeric, DateTime, func, UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class RecurringParticipation(Base):
    __tablename__ = "recurring_participations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recurring_expense_id = Column(UUID(as_uuid=True), ForeignKey("recurring_expenses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    value = Column(Numeric(12, 2), nullable=True)
    weight = Column(Numeric(10, 4), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    recurring_expense = relationship("RecurringExpense", back_populates="participations")
    user = relationship("User", back_populates="recurring_participations", lazy="joined")
    
    __table_args__ = (
        UniqueConstraint("recurring_expense_id", "user_id", name="uq_recurring_expense_user"),
    )
