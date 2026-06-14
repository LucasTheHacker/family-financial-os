from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from decimal import Decimal
from app.models.user import User
from app.models.recurring_expense import RecurringExpense
from app.models.recurring_participation import RecurringParticipation
from app.schemas.recurring_expense import (
    RecurringExpenseCreate,
    RecurringExpenseUpdate,
    RecurringParticipationCreate
)
from app.crud.expense import distribute_shares

def get_recurring_expense(db: Session, recurring_id: UUID) -> Optional[RecurringExpense]:
    """
    Get a recurring expense template by its UUID.
    """
    return db.query(RecurringExpense).filter(RecurringExpense.id == recurring_id).first()

def get_recurring_expenses(db: Session, skip: int = 0, limit: int = 100) -> List[RecurringExpense]:
    """
    Get a list of active and inactive recurring expense templates.
    """
    return db.query(RecurringExpense).offset(skip).limit(limit).all()

def create_recurring_expense(db: Session, recurring_in: RecurringExpenseCreate) -> RecurringExpense:
    """
    Creates a new recurring expense template.
    Validates user existence and mathematical consistency of participations.
    """
    # 1. Validate payer exists
    payer = db.query(User).filter(User.id == recurring_in.payer_id).first()
    if not payer:
        raise ValueError(f"Payer user with ID {recurring_in.payer_id} does not exist")

    # 2. Validate all participants exist and are unique
    participant_ids = {p.user_id for p in recurring_in.participations}
    db_users_count = db.query(User).filter(User.id.in_(list(participant_ids))).count()
    if db_users_count != len(participant_ids):
        raise ValueError("One or more participant user IDs do not exist")

    # 3. Validate math consistency using distribute_shares
    distribute_shares(recurring_in.total_amount, recurring_in.participations)

    # 4. Create template
    db_recurring = RecurringExpense(
        title=recurring_in.title,
        total_amount=recurring_in.total_amount,
        payer_id=recurring_in.payer_id,
        is_active=recurring_in.is_active
    )
    db.add(db_recurring)
    db.flush()  # Generate UUID

    # 5. Create participations
    for part in recurring_in.participations:
        db_part = RecurringParticipation(
            recurring_expense_id=db_recurring.id,
            user_id=part.user_id,
            value=part.value,
            weight=part.weight
        )
        db.add(db_part)

    db.commit()
    db.refresh(db_recurring)
    return db_recurring

def update_recurring_expense(
    db: Session, db_recurring: RecurringExpense, recurring_in: RecurringExpenseUpdate
) -> RecurringExpense:
    """
    Updates an existing recurring expense template.
    """
    update_data = recurring_in.model_dump(exclude_unset=True)

    # Validate payer if provided
    if "payer_id" in update_data:
        payer = db.query(User).filter(User.id == update_data["payer_id"]).first()
        if not payer:
            raise ValueError(f"Payer user with ID {update_data['payer_id']} does not exist")
        db_recurring.payer_id = update_data["payer_id"]

    # Basic scalar field updates
    for field in ["title", "is_active"]:
        if field in update_data:
            setattr(db_recurring, field, update_data[field])

    # Handle total_amount and participation updates
    has_amount_update = "total_amount" in update_data
    has_parts_update = "participations" in update_data

    if has_amount_update or has_parts_update:
        new_amount = update_data.get("total_amount", db_recurring.total_amount)

        if has_parts_update:
            new_parts = recurring_in.participations
            # Validate participant users exist
            part_ids = {p.user_id for p in new_parts}
            db_users_count = db.query(User).filter(User.id.in_(list(part_ids))).count()
            if db_users_count != len(part_ids):
                raise ValueError("One or more participant user IDs do not exist")

            # Validate math consistency
            distribute_shares(new_amount, new_parts)

            # Clear old participations
            db_recurring.participations.clear()
            db.flush()

            # Add new participations
            for part in new_parts:
                db_part = RecurringParticipation(
                    user_id=part.user_id,
                    value=part.value,
                    weight=part.weight
                )
                db_recurring.participations.append(db_part)

            db_recurring.total_amount = new_amount
        else:
            # Only amount updated. Verify if current participations use fixed values.
            # If so, we cannot auto-scale them, and must raise an error.
            has_fixed_values = any(
                p.value is not None and p.weight is None for p in db_recurring.participations
            )
            if has_fixed_values:
                raise ValueError(
                    "Cannot update total_amount without providing new participations when fixed values are used"
                )

            # Convert DB participations to validation schemas
            parts_in = [
                RecurringParticipationCreate(user_id=p.user_id, value=p.value, weight=p.weight)
                for p in db_recurring.participations
            ]
            distribute_shares(new_amount, parts_in)
            db_recurring.total_amount = new_amount

    db.add(db_recurring)
    db.commit()
    db.refresh(db_recurring)
    return db_recurring

def delete_recurring_expense(db: Session, db_recurring: RecurringExpense) -> bool:
    """
    Deletes a recurring expense template.
    """
    db.delete(db_recurring)
    db.commit()
    return True
