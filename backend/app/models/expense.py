from sqlalchemy import Column, String, Numeric, DateTime, func, UUID, ForeignKey, Integer
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    expense_type = Column(String(50), nullable=False) # 'Single', 'Fixed', 'Installment'
    billing_cycle = Column(String(7), nullable=False) # 'YYYY-MM'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Module 3 columns
    recurring_expense_id = Column(UUID(as_uuid=True), nullable=True)
    installment_number = Column(Integer, nullable=True)
    total_installments = Column(Integer, nullable=True)
    parent_installment_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    # Setting lazy="joined" automatically loads the payer during query
    payer = relationship("User", back_populates="expenses", lazy="joined")
    # Setting lazy="selectin" automatically loads participations during query
    participations = relationship(
        "Participation", 
        back_populates="expense", 
        cascade="all, delete-orphan", 
        lazy="selectin"
    )
    
