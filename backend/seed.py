
from datetime import date
from decimal import Decimal

from database import SessionLocal
from models import User, Category, Transaction, Budget
from security import hash_password


def seed_database():
    db = SessionLocal()

    try:
        # 1. Find or create the demo user
        demo_user = db.query(User).filter(
            User.email == "demo@vundlafinance.com"
        ).first()

        if demo_user is None:
            demo_user = User(
                name="Vundla Finance Demo",
                email="demo@vundlafinance.com",
                hashed_password=hash_password("DemoPass123!"),
                role="User"
            )

            db.add(demo_user)
            db.flush()

        # 2. Create default categories
        category_details = [
            ("Salary", "Income"),
            ("Groceries", "Expense"),
            ("Transport", "Expense"),
            ("Rent", "Expense")
        ]

        categories = {}

        for name, category_type in category_details:
            category = db.query(Category).filter(
                Category.user_id == demo_user.id,
                Category.name == name
            ).first()

            if category is None:
                category = Category(
                    name=name,
                    type=category_type,
                    user_id=demo_user.id
                )

                db.add(category)
                db.flush()

            categories[name] = category

        # 3. Create sample transactions
        sample_transactions = [
            ("Monthly salary", "15000.00", "Income", "Salary"),
            ("Weekly groceries", "1200.00", "Expense", "Groceries"),
            ("Taxi and transport", "600.00", "Expense", "Transport"),
            ("Monthly rent", "4500.00", "Expense", "Rent"),
            ("Additional groceries", "850.00", "Expense", "Groceries")
        ]

        for description, amount, transaction_type, category_name in sample_transactions:
            existing_transaction = db.query(Transaction).filter(
                Transaction.user_id == demo_user.id,
                Transaction.description == description
            ).first()

            if existing_transaction is None:
                transaction = Transaction(
                    description=description,
                    amount=Decimal(amount),
                    type=transaction_type,
                    date=date.today(),
                    user_id=demo_user.id,
                    category_id=categories[category_name].id
                )

                db.add(transaction)

        # 4. Create monthly budgets
        current_month = date.today().month
        current_year = date.today().year

        sample_budgets = [
            ("Groceries", "2500.00"),
            ("Transport", "1200.00"),
            ("Rent", "5000.00")
        ]

        for category_name, amount in sample_budgets:
            existing_budget = db.query(Budget).filter(
                Budget.user_id == demo_user.id,
                Budget.category_id == categories[category_name].id,
                Budget.month == current_month,
                Budget.year == current_year
            ).first()

            if existing_budget is None:
                budget = Budget(
                    amount=Decimal(amount),
                    month=current_month,
                    year=current_year,
                    user_id=demo_user.id,
                    category_id=categories[category_name].id
                )

                db.add(budget)

        # 5. Save everything
        db.commit()

        print("Database seeding completed successfully!")
        print("Demo user: demo@vundlafinance.com")
        print("Demo password: DemoPass123!")

    except Exception as error:
        db.rollback()
        print("Database seeding failed:", error)

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
