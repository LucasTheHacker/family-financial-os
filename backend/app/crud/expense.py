from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from decimal import Decimal
import uuid
from app.models.user import User
from app.models.expense import Expense
from app.models.participation import Participation
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.schemas.participation import ParticipationCreate

def distribute_shares(total_amount: Decimal, participations: List[ParticipationCreate]) -> List[dict]:
    """
    Business Logic: Distributes the total_amount across participants based on values or weights.
    Handles a mix of fixed values and weights, and resolves rounding differences.
    """
    fixed_sum = Decimal("0.00")
    total_weight = Decimal("0.0000")
    
    for p in participations:
        if p.value is not None:
            fixed_sum += p.value
        elif p.weight is not None:
            total_weight += p.weight
            
    if fixed_sum > total_amount:
        raise ValueError(f"Sum of fixed participation values ({fixed_sum}) exceeds total expense amount ({total_amount})")
        
    remaining_amount = total_amount - fixed_sum
    weighted_count = sum(1 for p in participations if p.value is None and p.weight is not None)
    
    if weighted_count > 0 and total_weight <= 0:
        raise ValueError("Total weight must be greater than 0 when using weight-based split")
        
    if weighted_count == 0 and fixed_sum != total_amount:
        raise ValueError(f"Sum of participation values ({fixed_sum}) must equal total expense amount ({total_amount})")
        
    shares = []
    calculated_sum = Decimal("0.00")
    
    for p in participations:
        share_value = Decimal("0.00")
        if p.value is not None:
            share_value = p.value
        elif p.weight is not None and total_weight > 0:
            share_value = (p.weight / total_weight * remaining_amount).quantize(Decimal("0.01"))
            
        shares.append({
            "user_id": p.user_id,
            "value": share_value,
            "weight": p.weight
        })
        calculated_sum += share_value
        
    difference = total_amount - calculated_sum
    if difference != 0 and len(shares) > 0:
        adjustment_index = -1
        for i in range(len(shares) - 1, -1, -1):
            if participations[i].value is None and participations[i].weight is not None:
                adjustment_index = i
                break
        if adjustment_index == -1:
            adjustment_index = len(shares) - 1
            
        shares[adjustment_index]["value"] += difference
        
    return shares

def get_expense(db: Session, expense_id: UUID) -> Optional[Expense]:
    # Because of lazy="joined" and lazy="selectin" in our models,
    # the payer and participations are eager loaded automatically.
    return db.query(Expense).filter(Expense.id == expense_id).first()

def get_expenses(db: Session, skip: int = 0, limit: int = 100) -> List[Expense]:
    return db.query(Expense).offset(skip).limit(limit).all()

def get_expenses_by_billing_cycle(db: Session, billing_cycle: str) -> List[Expense]:
    return db.query(Expense).filter(Expense.billing_cycle == billing_cycle).all()

def increment_billing_cycle(billing_cycle: str, months_to_add: int) -> str:
    """
    Increments a YYYY-MM billing cycle by a number of months.
    """
    year = int(billing_cycle[:4])
    month = int(billing_cycle[5:7])
    
    total_months = month + months_to_add - 1
    new_year = year + (total_months // 12)
    new_month = (total_months % 12) + 1
    
    return f"{new_year:04d}-{new_month:02d}"

def create_expense(db: Session, expense_in: ExpenseCreate) -> Expense:
    # 1. Validate payer exists
    payer = db.query(User).filter(User.id == expense_in.payer_id).first()
    if not payer:
        raise ValueError(f"Payer user with ID {expense_in.payer_id} does not exist")

    # 2. Validate all participants exist and are unique
    participant_ids = {p.user_id for p in expense_in.participations}
    db_users_count = db.query(User).filter(User.id.in_(list(participant_ids))).count()
    if db_users_count != len(participant_ids):
        raise ValueError("One or more participant user IDs do not exist")

    if expense_in.expense_type == "Installment":
        total_inst = expense_in.total_installments
        if not total_inst or total_inst < 1:
            raise ValueError("total_installments must be at least 1 when expense_type is 'Installment'")
            
        parent_inst_id = uuid.uuid4()
        
        # Calculate monthly installment amounts (with cross-month rounding corrections)
        total_amount = Decimal(str(expense_in.total_amount))
        base_inst_amount = (total_amount / total_inst).quantize(Decimal("0.01"))
        last_inst_amount = total_amount - (base_inst_amount * (total_inst - 1))
        
        generated_expenses = []
        for i in range(1, total_inst + 1):
            inst_amount = base_inst_amount if i < total_inst else last_inst_amount
            inst_billing_cycle = increment_billing_cycle(expense_in.billing_cycle, i - 1)
            inst_title = f"{expense_in.title} ({i}/{total_inst})"
            
            # Divide participation inputs
            inst_parts = []
            for p in expense_in.participations:
                if p.value is not None:
                    p_total_value = Decimal(str(p.value))
                    p_base_value = (p_total_value / total_inst).quantize(Decimal("0.01"))
                    p_last_value = p_total_value - (p_base_value * (total_inst - 1))
                    p_val = p_base_value if i < total_inst else p_last_value
                    inst_parts.append(ParticipationCreate(user_id=p.user_id, value=p_val))
                else:
                    inst_parts.append(ParticipationCreate(user_id=p.user_id, weight=p.weight))
                    
            # Distribute shares for this month's installment
            distributed_shares = distribute_shares(inst_amount, inst_parts)
            
            # Create the expense row
            db_expense = Expense(
                title=inst_title,
                total_amount=inst_amount,
                date=expense_in.date,
                payer_id=expense_in.payer_id,
                expense_type=expense_in.expense_type,
                billing_cycle=inst_billing_cycle,
                installment_number=i,
                total_installments=total_inst,
                parent_installment_id=parent_inst_id
            )
            db.add(db_expense)
            db.flush()  # Generate expense ID
            
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
            
        db.commit()
        # Refresh to load relationships
        for e in generated_expenses:
            db.refresh(e)
            
        return generated_expenses[0]
        
    else:
        # Standard Single / Fixed expense creation
        distributed_shares = distribute_shares(expense_in.total_amount, expense_in.participations)

        db_expense = Expense(
            title=expense_in.title,
            total_amount=expense_in.total_amount,
            date=expense_in.date,
            payer_id=expense_in.payer_id,
            expense_type=expense_in.expense_type,
            billing_cycle=expense_in.billing_cycle
        )
        db.add(db_expense)
        db.flush()

        for share in distributed_shares:
            db_part = Participation(
                expense_id=db_expense.id,
                user_id=share["user_id"],
                value=share["value"],
                weight=share["weight"]
            )
            db.add(db_part)

        db.commit()
        db.refresh(db_expense)
        return db_expense

def update_expense(db: Session, db_expense: Expense, expense_in: ExpenseUpdate) -> Expense:
    update_data = expense_in.model_dump(exclude_unset=True)
    
    # If total_amount or participations is modified, we require both to recalculate correctly,
    # or if only one is updated we perform the necessary checks.
    has_amount_update = "total_amount" in update_data
    has_parts_update = "participations" in update_data

    # Check if payer is being updated and validate it
    if "payer_id" in update_data:
        payer = db.query(User).filter(User.id == update_data["payer_id"]).first()
        if not payer:
            raise ValueError(f"Payer user with ID {update_data['payer_id']} does not exist")
        db_expense.payer_id = update_data["payer_id"]

    # Basic scalar field updates
    for field in ["title", "date", "expense_type", "billing_cycle"]:
        if field in update_data:
            setattr(db_expense, field, update_data[field])

    # Handle amount and participation updates
    if has_amount_update or has_parts_update:
        new_amount = update_data.get("total_amount", db_expense.total_amount)
        
        # If participations are provided, rebuild them
        if has_parts_update:
            new_parts = expense_in.participations
            # Validate participant users exist
            part_ids = {p.user_id for p in new_parts}
            db_users_count = db.query(User).filter(User.id.in_(list(part_ids))).count()
            if db_users_count != len(part_ids):
                raise ValueError("One or more participant user IDs do not exist")
                
            # Distribute shares
            distributed_shares = distribute_shares(new_amount, new_parts)
            
            # Clear old participations and let delete-orphan cascade handle deletion
            db_expense.participations.clear()
            db.flush()
            
            # Create new ones
            for share in distributed_shares:
                db_part = Participation(
                    user_id=share["user_id"],
                    value=share["value"],
                    weight=share["weight"]
                )
                db_expense.participations.append(db_part)
            
            db_expense.total_amount = new_amount
        else:
            # If total_amount changed but participations were not provided:
            # If current participations are weight-based, we can recalculate.
            # Otherwise (fixed values), we can't easily auto-scale, so we raise an error.
            current_parts = db_expense.participations
            has_fixed_values = any(p.value is not None and p.weight is None for p in current_parts)
            
            if has_fixed_values:
                raise ValueError("Cannot update total_amount without providing new participations when fixed values are used")
            
            # Re-distribute using existing weights
            parts_in = [
                ParticipationCreate(user_id=p.user_id, weight=p.weight) 
                for p in current_parts
            ]
            distributed_shares = distribute_shares(new_amount, parts_in)
            
            # Rebuild participations with new values
            db_expense.participations.clear()
            db.flush()
            for share in distributed_shares:
                db_part = Participation(
                    user_id=share["user_id"],
                    value=share["value"],
                    weight=share["weight"]
                )
                db_expense.participations.append(db_part)
                
            db_expense.total_amount = new_amount

    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_expense(db: Session, db_expense: Expense, delete_group: bool = False) -> bool:
    if delete_group and db_expense.parent_installment_id:
        db.query(Expense).filter(Expense.parent_installment_id == db_expense.parent_installment_id).delete()
    else:
        db.delete(db_expense)
    db.commit()
    return True
