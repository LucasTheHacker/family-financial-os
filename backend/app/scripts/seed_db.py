import sys
import os
from decimal import Decimal
from datetime import datetime

# Adjust Python path to include backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.expense import Expense
from app.models.participation import Participation

from app.schemas.expense import ExpenseCreate
from app.schemas.participation import ParticipationCreate

from app.crud.expense import create_expense

def seed():
    print("Iniciando semeadura do banco de dados...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Limpar dados existentes
        print("Limpando tabelas antigas...")
        db.query(Participation).delete()
        db.query(Expense).delete()
        db.query(User).delete()
        db.commit()

        # 2. Criar Usuários
        print("Registrando novos membros da família...")
        lucas = User(
            name="Lucas Santos",
            email="lucas@familia.com.br",
            pix_key="lucas@pix.com.br"
        )
        maria = User(
            name="Maria Oliveira",
            email="maria@familia.com.br",
            pix_key="48999999999"
        )
        joao = User(
            name="João Silva",
            email="joao@familia.com.br",
            pix_key="joao.silva@pix.com.br"
        )
        db.add_all([lucas, maria, joao])
        db.flush() # Gerar UUIDs
        
        print(f"Membros criados: {lucas.name} ({lucas.id}), {maria.name} ({maria.id}), {joao.name} ({joao.id})")

        # 3. Criar Despesas Normais do ciclo atual (2026-05)
        print("Registrando despesas individuais...")
        ciclo_atual = "2026-05"
        data_atual = datetime(2026, 5, 22, 12, 0, 0)

        # Supermercado - Lucas pagou, dividido igualmente
        create_expense(db, ExpenseCreate(
            title="Supermercado Semanal",
            total_amount=Decimal("450.00"),
            date=data_atual,
            payer_id=lucas.id,
            expense_type="Single",
            billing_cycle=ciclo_atual,
            participations=[
                ParticipationCreate(user_id=lucas.id, weight=Decimal("1.0")),
                ParticipationCreate(user_id=maria.id, weight=Decimal("1.0")),
                ParticipationCreate(user_id=joao.id, weight=Decimal("1.0")),
            ]
        ))

        # Aluguel - Maria pagou, dividido igualmente
        create_expense(db, ExpenseCreate(
            title="Aluguel do Apartamento",
            total_amount=Decimal("1200.00"),
            date=data_atual,
            payer_id=maria.id,
            expense_type="Single",
            billing_cycle=ciclo_atual,
            participations=[
                ParticipationCreate(user_id=lucas.id, weight=Decimal("1.0")),
                ParticipationCreate(user_id=maria.id, weight=Decimal("1.0")),
                ParticipationCreate(user_id=joao.id, weight=Decimal("1.0")),
            ]
        ))

        # Faxina - Lucas pagou, dividido entre Lucas e Maria apenas (João não participou)
        create_expense(db, ExpenseCreate(
            title="Faxina Quinzenal",
            total_amount=Decimal("200.00"),
            date=data_atual,
            payer_id=lucas.id,
            expense_type="Single",
            billing_cycle=ciclo_atual,
            participations=[
                ParticipationCreate(user_id=lucas.id, weight=Decimal("1.0")),
                ParticipationCreate(user_id=maria.id, weight=Decimal("1.0")),
            ]
        ))

        print("Semeadura concluída com sucesso!")

    except Exception as e:
        print(f"Erro durante a semeadura: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
