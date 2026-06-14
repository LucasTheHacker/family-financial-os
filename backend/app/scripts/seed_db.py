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
from app.models.recurring_expense import RecurringExpense
from app.models.recurring_participation import RecurringParticipation

from app.schemas.expense import ExpenseCreate
from app.schemas.participation import ParticipationCreate
from app.schemas.recurring_expense import RecurringExpenseCreate, RecurringParticipationCreate


from app.crud.expense import create_expense
from app.crud.recurring_expense import create_recurring_expense
from app.services.recurring_generation import generate_monthly_recurring


def seed():
    print("Iniciando semeadura do banco de dados...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Limpar dados existentes
        print("Limpando tabelas antigas...")
        db.query(RecurringParticipation).delete()
        db.query(RecurringExpense).delete()
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

        # 3. Criar Modelos Recorrentes
        print("Criando modelos de despesas recorrentes...")
        
        # Netflix - João paga, dividido igualmente por todos
        netflix = create_recurring_expense(db, RecurringExpenseCreate(
            title="Assinatura Netflix Premium",
            total_amount=Decimal("55.90"),
            payer_id=joao.id,
            is_active=True,
            participations=[
                RecurringParticipationCreate(user_id=lucas.id, weight=Decimal("1.0")),
                RecurringParticipationCreate(user_id=maria.id, weight=Decimal("1.0")),
                RecurringParticipationCreate(user_id=joao.id, weight=Decimal("1.0")),
            ]
        ))
        
        # Internet - Lucas paga, dividido igualmente por todos
        internet = create_recurring_expense(db, RecurringExpenseCreate(
            title="Internet Fibra 300MB",
            total_amount=Decimal("120.00"),
            payer_id=lucas.id,
            is_active=True,
            participations=[
                RecurringParticipationCreate(user_id=lucas.id, weight=Decimal("1.0")),
                RecurringParticipationCreate(user_id=maria.id, weight=Decimal("1.0")),
                RecurringParticipationCreate(user_id=joao.id, weight=Decimal("1.0")),
            ]
        ))

        # 4. Criar Despesas Normais do ciclo atual (2026-05)
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

        # Compra de Geladeira - Maria pagou, parcelado em 3x de 500.00, dividido igualmente
        # Isso vai criar automaticamente despesas para 2026-05 (1/3), 2026-06 (2/3), e 2026-07 (3/3).
        print("Registrando parcelamento da Geladeira (3 parcelas)...")
        create_expense(db, ExpenseCreate(
            title="Compra de Geladeira",
            total_amount=Decimal("1500.00"),
            date=data_atual,
            payer_id=maria.id,
            expense_type="Installment",
            billing_cycle=ciclo_atual,
            total_installments=3,
            participations=[
                ParticipationCreate(user_id=lucas.id, weight=Decimal("1.0")),
                ParticipationCreate(user_id=maria.id, weight=Decimal("1.0")),
                ParticipationCreate(user_id=joao.id, weight=Decimal("1.0")),
            ]
        ))

        # 5. Gerar despesas recorrentes para o ciclo atual
        generate_monthly_recurring(db, ciclo_atual)


        print("Semeadura concluída com sucesso!")

    except Exception as e:
        db.rollback()
        print(f"Erro na semeadura: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
