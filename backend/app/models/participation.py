from sqlalchemy import Column, Numeric, DateTime, func, UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Participation(Base):
    __tablename__ = "participations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    value = Column(Numeric(12, 2), nullable=True)
    weight = Column(Numeric(10, 4), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    expense = relationship("Expense", back_populates="participations")
    # Setting lazy="joined" automatically loads the associated user
    user = relationship("User", back_populates="participations", lazy="joined")
    
    __table_args__ = (
        UniqueConstraint("expense_id", "user_id", name="uq_expense_user"),
    )
