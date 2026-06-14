import sys
import os
import argparse
from datetime import datetime
import re

# Set up PYTHONPATH so we can run this script directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal, engine, Base
from app.config import settings
from app.services.recurring_generation import generate_monthly_recurring

def main():
    parser = argparse.ArgumentParser(description="Generate monthly expenses from active recurring templates.")
    parser.add_argument(
        "--billing-cycle",
        type=str,
        default=datetime.now().strftime("%Y-%m"),
        help="Billing cycle to generate expenses for (format YYYY-MM). Defaults to the current month."
    )
    args = parser.parse_args()
    
    billing_cycle = args.billing_cycle
    if not re.match(r"^[0-9]{4}-[0-9]{2}$", billing_cycle):
        print(f"Error: Invalid billing cycle format '{billing_cycle}'. Must be YYYY-MM.")
        sys.exit(1)
        
    # Auto-initialize database tables in non-production environments
    if settings.ENV != "production":
        Base.metadata.create_all(bind=engine)
        
    print(f"Generating recurring expenses for billing cycle: {billing_cycle}...")
    db = SessionLocal()
    try:
        generated = generate_monthly_recurring(db, billing_cycle)
        print(f"Successfully generated {len(generated)} expenses:")
        for exp in generated:
            print(f" - [{exp.id}] {exp.title}: {exp.total_amount} (Payer: {exp.payer.name})")
    except Exception as e:
        print(f"Error generating recurring expenses: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
