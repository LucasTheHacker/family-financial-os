from sqlalchemy.orm import Session
from decimal import Decimal
from uuid import UUID
from typing import List, Dict, Any
from app.models.user import User
from app.models.expense import Expense

class DebtSimplifier:
    """
    Service class responsible for calculating user balances and simplifying
    debts within a family or group for a given billing cycle.
    """
    
    @staticmethod
    def simplify_debts(balances: Dict[UUID, Decimal]) -> List[Dict[str, Any]]:
        """
        Pure algorithmic business logic.
        Simplifies debts among users using a greedy settlement strategy.
        Returns a list of transactions showing A owes X to B.
        """
        debtors = []
        creditors = []
        
        for user_id, bal in balances.items():
            if bal < Decimal("-0.005"):
                debtors.append({"user_id": user_id, "amount": abs(bal)})
            elif bal > Decimal("0.005"):
                creditors.append({"user_id": user_id, "amount": bal})
                
        # Sort so we process the largest amounts first
        debtors.sort(key=lambda x: x["amount"], reverse=True)
        creditors.sort(key=lambda x: x["amount"], reverse=True)
        
        transactions = []
        
        while debtors and creditors:
            debtor = debtors[0]
            creditor = creditors[0]
            
            settle_amount = min(debtor["amount"], creditor["amount"]).quantize(Decimal("0.01"))
            
            if settle_amount > Decimal("0.00"):
                transactions.append({
                    "from_user_id": debtor["user_id"],
                    "to_user_id": creditor["user_id"],
                    "amount": settle_amount
                })
                
            debtor["amount"] -= settle_amount
            creditor["amount"] -= settle_amount
            
            # Pop settled parties, or re-sort to maintain greedy priority
            if debtor["amount"] < Decimal("0.01"):
                debtors.pop(0)
            else:
                debtors.sort(key=lambda x: x["amount"], reverse=True)
                
            if creditor["amount"] < Decimal("0.01"):
                creditors.pop(0)
            else:
                creditors.sort(key=lambda x: x["amount"], reverse=True)
                
        return transactions

    @classmethod
    def calculate_settlements(cls, db: Session, billing_cycle: str) -> Dict[str, Any]:
        """
        Calculates total paid, total consumed, and net balances for all users,
        then runs the simplification algorithm for the given billing cycle.
        """
        # Fetch all users and relevant expenses
        users = db.query(User).all()
        expenses = db.query(Expense).filter(Expense.billing_cycle == billing_cycle).all()
        
        user_names = {user.id: user.name for user in users}
        
        # Initialize payment tracking
        total_paid = {user.id: Decimal("0.00") for user in users}
        total_consumed = {user.id: Decimal("0.00") for user in users}
        
        # Aggregate amounts from expenses and participations
        for expense in expenses:
            total_paid[expense.payer_id] += Decimal(str(expense.total_amount))
            for part in expense.participations:
                part_val = Decimal(str(part.value)) if part.value is not None else Decimal("0.00")
                total_consumed[part.user_id] += part_val
                
        # Calculate net balances
        balances = {}
        user_reports = []
        
        for user in users:
            paid = total_paid[user.id]
            consumed = total_consumed[user.id]
            net_bal = (paid - consumed).quantize(Decimal("0.01"))
            
            balances[user.id] = net_bal
            
            user_reports.append({
                "user_id": user.id,
                "user_name": user.name,
                "total_paid": paid,
                "total_consumed": consumed,
                "net_balance": net_bal
            })
            
        # Settle debts
        optimized_transactions = cls.simplify_debts(balances)
        
        # Build list containing user display names
        transactions_with_names = []
        for tx in optimized_transactions:
            transactions_with_names.append({
                "from_user_id": tx["from_user_id"],
                "from_user_name": user_names.get(tx["from_user_id"], "Unknown"),
                "to_user_id": tx["to_user_id"],
                "to_user_name": user_names.get(tx["to_user_id"], "Unknown"),
                "amount": tx["amount"]
            })
            
        return {
            "billing_cycle": billing_cycle,
            "balances": user_reports,
            "transactions": transactions_with_names
        }
