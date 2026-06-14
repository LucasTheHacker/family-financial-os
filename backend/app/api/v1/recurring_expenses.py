from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
import re
from app.database import get_db
from app.schemas.recurring_expense import (
    RecurringExpenseCreate,
    RecurringExpenseUpdate,
    RecurringExpenseResponse
)
from app.schemas.expense import ExpenseResponse
from app.crud import recurring_expense as crud_recurring
from app.services.recurring_generation import generate_monthly_recurring

router = APIRouter()

@router.post("/", response_model=RecurringExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_expense(
    recurring_in: RecurringExpenseCreate, db: Session = Depends(get_db)
):
    try:
        return crud_recurring.create_recurring_expense(db=db, recurring_in=recurring_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[RecurringExpenseResponse])
def read_recurring_expenses(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    return crud_recurring.get_recurring_expenses(db, skip=skip, limit=limit)

@router.get("/{recurring_id}", response_model=RecurringExpenseResponse)
def read_recurring_expense(recurring_id: UUID, db: Session = Depends(get_db)):
    db_recurring = crud_recurring.get_recurring_expense(db, recurring_id=recurring_id)
    if not db_recurring:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring expense template not found"
        )
    return db_recurring

@router.put("/{recurring_id}", response_model=RecurringExpenseResponse)
def update_recurring_expense(
    recurring_id: UUID, recurring_in: RecurringExpenseUpdate, db: Session = Depends(get_db)
):
    db_recurring = crud_recurring.get_recurring_expense(db, recurring_id=recurring_id)
    if not db_recurring:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring expense template not found"
        )
    try:
        return crud_recurring.update_recurring_expense(
            db=db, db_recurring=db_recurring, recurring_in=recurring_in
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_expense(recurring_id: UUID, db: Session = Depends(get_db)):
    db_recurring = crud_recurring.get_recurring_expense(db, recurring_id=recurring_id)
    if not db_recurring:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring expense template not found"
        )
    crud_recurring.delete_recurring_expense(db=db, db_recurring=db_recurring)
    return None

@router.post("/generate", response_model=List[ExpenseResponse])
def trigger_recurring_generation(billing_cycle: str, db: Session = Depends(get_db)):
    """
    Triggers generation of monthly fixed expenses based on active recurring templates.
    Accepts billing_cycle in YYYY-MM format.
    """
    if not re.match(r"^[0-9]{4}-[0-9]{2}$", billing_cycle):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="billing_cycle must be in format YYYY-MM"
        )
    
    return generate_monthly_recurring(db=db, billing_cycle=billing_cycle)
