from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.models.expense import Expense
from app.models.participation import Participation
from app.models.recurring_expense import RecurringExpense
from app.schemas.participation import ParticipationCreate
from app.crud.expense import distribute_shares

def generate_monthly_recurring(db: Session, billing_cycle: str) -> List[Expense]:
    """
    Generates concrete Expenses from active RecurringExpense templates for a given billing cycle.
    Ensures idempotency (skips generation if expense already exists for template + cycle).
    """
    # Get all active templates
    templates = db.query(RecurringExpense).filter(RecurringExpense.is_active == True).all()
    
    generated_expenses = []
    
    for template in templates:
        # Check for existing expense to guarantee idempotency
        existing = db.query(Expense).filter(
            Expense.recurring_expense_id == template.id,
            Expense.billing_cycle == billing_cycle
        ).first()
        
        if existing:
            continue
            
        # Prepare participations for distribute_shares
        parts_in = [
            ParticipationCreate(user_id=p.user_id, value=p.value, weight=p.weight)
            for p in template.participations
        ]
        
        # Calculate shares
        distributed_shares = distribute_shares(template.total_amount, parts_in)
        
        # Create new Expense
        db_expense = Expense(
            title=template.title,
            total_amount=template.total_amount,
            date=datetime.now(),
            payer_id=template.payer_id,
            expense_type="Fixed",
            billing_cycle=billing_cycle,
            recurring_expense_id=template.id
        )
        db.add(db_expense)
        db.flush()
        
        # Create participations
        for share in distributed_shares:
            db_part = Participation(
                expense_id=db_expense.id,
                user_id=share["user_id"],
                value=share["value"],
                weight=share["weight"]
            )
            db.add(db_part)
            
        generated_expenses.append(db_expense)
        
    if generated_expenses:
        db.commit()
        for e in generated_expenses:
            db.refresh(e)
            
    return generated_expenses
