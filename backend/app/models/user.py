from sqlalchemy import Column, String, DateTime, func, UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    pix_key = Column(String(255), nullable=True)
    avatar_url = Column(String(2048), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    # Note: Using back_populates to keep associations dual-linked.
    # payer_id is the foreign key in Expense referencing User.id
    expenses = relationship("Expense", back_populates="payer", cascade="all, delete-orphan")
    participations = relationship("Participation", back_populates="user", cascade="all, delete-orphan")
    

