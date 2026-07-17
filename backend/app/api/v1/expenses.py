from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from app.database import get_db
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.schemas.settlement import SettlementReport
from app.crud import expense as crud_expense
from app.services.debt_simplification import DebtSimplifier

router = APIRouter()

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(expense_in: ExpenseCreate, db: Session = Depends(get_db)):
    try:
        return crud_expense.create_expense(db=db, expense_in=expense_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[ExpenseResponse])
def read_expenses(
    billing_cycle: Optional[str] = None, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    if billing_cycle:
        return crud_expense.get_expenses_by_billing_cycle(db, billing_cycle=billing_cycle)
    return crud_expense.get_expenses(db, skip=skip, limit=limit)

@router.get("/settlement", response_model=SettlementReport)
def calculate_settlement(billing_cycle: str, db: Session = Depends(get_db)):
    """
    Calculates who owes whom for a given billing cycle (month in format YYYY-MM),
    minimizing transaction count via a greedy settlement algorithm.
    """
    import re
    if not re.match(r"^[0-9]{4}-[0-9]{2}$", billing_cycle):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="billing_cycle must be in format YYYY-MM"
        )
    return DebtSimplifier.calculate_settlements(db=db, billing_cycle=billing_cycle)

@router.get("/{expense_id}", response_model=ExpenseResponse)
def read_expense(expense_id: UUID, db: Session = Depends(get_db)):
    db_expense = crud_expense.get_expense(db, expense_id=expense_id)
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    return db_expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: UUID, expense_in: ExpenseUpdate, db: Session = Depends(get_db)):
    db_expense = crud_expense.get_expense(db, expense_id=expense_id)
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    try:
        return crud_expense.update_expense(db=db, db_expense=db_expense, expense_in=expense_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: UUID, db: Session = Depends(get_db)):
    db_expense = crud_expense.get_expense(db, expense_id=expense_id)
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    crud_expense.delete_expense(db=db, db_expense=db_expense)
    return None
