from fastapi import APIRouter, Depends
from app.api.v1.users import router as users_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.recurring_expenses import router as recurring_expenses_router
from app.api.deps import verify_jwt

api_router = APIRouter(dependencies=[Depends(verify_jwt)])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(expenses_router, prefix="/expenses", tags=["expenses"])
api_router.include_router(recurring_expenses_router, prefix="/recurring-expenses", tags=["recurring-expenses"])
