
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from schemas import UserCreate, UserLogin, Transaction, CategoryCreate, BudgetCreate
from database import get_db
from models import (
    User as UserModel,
    Transaction as TransactionModel,
    Category as CategoryModel,
    Budget as BudgetModel
)
from security import hash_password, verify_password
from auth import create_access_token, verify_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


security = HTTPBearer()

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ========================================
# AUTHENTICATION
# ========================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in token"
        )

    user = db.query(UserModel).filter(
        UserModel.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def get_admin_user(
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# ========================================
# ADMIN ENDPOINTS
# ========================================

@app.get("/admin/test")
def admin_test(
    current_user: UserModel = Depends(get_admin_user)
):
    return {"message": "Admin access granted"}


@app.get("/admin/statistics")
def get_admin_statistics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    total_users = db.query(func.count(UserModel.id)).scalar()
    total_transactions = db.query(func.count(TransactionModel.id)).scalar()
    total_categories = db.query(func.count(CategoryModel.id)).scalar()
    total_budgets = db.query(func.count(BudgetModel.id)).scalar()

    return {
        "total_users": total_users,
        "total_transactions": total_transactions,
        "total_categories": total_categories,
        "total_budgets": total_budgets
    }


# ========================================
# GENERAL ENDPOINTS
# ========================================

@app.get("/")
def home():
    return {"message": "Welcome to Vundla Finance API"}


@app.get("/health")
def health_check():
    return {"status": "Vundla Finance API is running"}


# ========================================
# USER REGISTRATION
# ========================================

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(UserModel).filter(
        UserModel.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = UserModel(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role="User"
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Account created successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }


# ========================================
# USER LOGIN
# ========================================

@app.post("/login")
def login_user(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(
        UserModel.email == credentials.email
    ).first()

    if user is None or not verify_password(
        credentials.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token({
        "sub": str(user.id)
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


# ========================================
# CREATE TRANSACTION
# ========================================

@app.post("/transactions")
def create_transaction(
    transaction: Transaction,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == transaction.category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    new_transaction = TransactionModel(
        description=transaction.description,
        amount=transaction.amount,
        type=transaction.type,
        date=transaction.date,
        user_id=current_user.id,
        category_id=transaction.category_id
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return {
        "message": "Transaction created successfully",
        "transaction": new_transaction.id
    }


# ========================================
# GET ALL TRANSACTIONS
# ========================================

@app.get("/transactions")
def get_transactions(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    transactions = db.query(TransactionModel).filter(
        TransactionModel.user_id == current_user.id
    ).all()

    return transactions


# ========================================
# GET ONE TRANSACTION
# ========================================

@app.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id,
        TransactionModel.user_id == current_user.id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return transaction


# ========================================
# UPDATE TRANSACTION
# ========================================

@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    transaction_data: Transaction,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id,
        TransactionModel.user_id == current_user.id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    category = db.query(CategoryModel).filter(
        CategoryModel.id == transaction_data.category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    transaction.description = transaction_data.description
    transaction.amount = transaction_data.amount
    transaction.type = transaction_data.type
    transaction.date = transaction_data.date
    transaction.category_id = transaction_data.category_id

    db.commit()
    db.refresh(transaction)

    return {
        "message": "Transaction updated successfully",
        "transaction": transaction.id
    }


# ========================================
# DELETE TRANSACTION
# ========================================

@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id,
        TransactionModel.user_id == current_user.id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    db.delete(transaction)
    db.commit()

    return {
        "message": "Transaction deleted successfully"
    }


# ========================================
# CREATE CATEGORY
# ========================================

@app.post("/categories")
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    new_category = CategoryModel(
        name=category.name,
        type=category.type,
        user_id=current_user.id
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return {
        "message": "Category created successfully",
        "category": new_category.id
    }


# ========================================
# GET ALL CATEGORIES
# ========================================

@app.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    categories = db.query(CategoryModel).filter(
        CategoryModel.user_id == current_user.id
    ).all()

    return categories


# ========================================
# GET ONE CATEGORY
# ========================================

@app.get("/categories/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category


# ========================================
# DELETE CATEGORY
# ========================================

@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    transaction = db.query(TransactionModel).filter(
        TransactionModel.category_id == category_id
    ).first()

    if transaction is not None:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete category because it has transactions"
        )

    budget = db.query(BudgetModel).filter(
        BudgetModel.category_id == category_id
    ).first()

    if budget is not None:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete category because it has budgets"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }


# ========================================
# UPDATE CATEGORY
# ========================================

@app.put("/categories/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    category.name = category_data.name
    category.type = category_data.type

    db.commit()
    db.refresh(category)

    return {
        "message": "Category updated successfully",
        "category": category.id
    }


# ========================================
# CREATE BUDGET
# ========================================

@app.post("/budgets")
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == budget.category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    new_budget = BudgetModel(
        amount=budget.amount,
        month=budget.month,
        year=budget.year,
        user_id=current_user.id,
        category_id=budget.category_id
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return {
        "message": "Budget created successfully",
        "budget": new_budget.id
    }


# ========================================
# GET ALL BUDGETS
# ========================================

@app.get("/budgets")
def get_budgets(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    budgets = db.query(BudgetModel).filter(
        BudgetModel.user_id == current_user.id
    ).all()

    return budgets


# ========================================
# GET BUDGETS WITH SPENDING INFORMATION
# ========================================

@app.get("/budgets/summary")
def get_budget_summaries(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Get all budgets belonging to the logged-in user
    budgets = db.query(BudgetModel).filter(
        BudgetModel.user_id == current_user.id
    ).all()

    budget_summaries = []

    # Calculate spending for each budget
    for budget in budgets:

        # Find Expense transactions for this category and month
        spent = db.query(
            func.coalesce(func.sum(TransactionModel.amount), 0)
        ).filter(
            TransactionModel.user_id == current_user.id,
            TransactionModel.category_id == budget.category_id,
            TransactionModel.type == "Expense",
            extract("month", TransactionModel.date) == budget.month,
            extract("year", TransactionModel.date) == budget.year
        ).scalar()

        # Calculate the remaining budget
        remaining = float(budget.amount) - float(spent)

        # Calculate percentage used
        percentage = (float(spent) / float(budget.amount)) * 100

        # Store the budget information
        budget_summaries.append({
            "id": budget.id,
            "category_id": budget.category_id,
            "category_name": budget.category.name,
            "amount": float(budget.amount),
            "month": budget.month,
            "year": budget.year,
            "spent": float(spent),
            "remaining": remaining,
            "percentage": round(percentage, 2)
        })

    return budget_summaries


# ========================================
# GET ONE BUDGET
# ========================================

@app.get("/budgets/{budget_id}")
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id,
        BudgetModel.user_id == current_user.id
    ).first()

    if budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    return budget


# ========================================
# UPDATE BUDGET
# ========================================

@app.put("/budgets/{budget_id}")
def update_budget(
    budget_id: int,
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    existing_budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id,
        BudgetModel.user_id == current_user.id
    ).first()

    if existing_budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    category = db.query(CategoryModel).filter(
        CategoryModel.id == budget.category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    existing_budget.amount = budget.amount
    existing_budget.month = budget.month
    existing_budget.year = budget.year
    existing_budget.category_id = budget.category_id

    db.commit()
    db.refresh(existing_budget)

    return {
        "message": "Budget updated successfully",
        "budget": existing_budget.id
    }


# ========================================
# DELETE BUDGET
# ========================================

@app.delete("/budgets/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id,
        BudgetModel.user_id == current_user.id
    ).first()

    if budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    db.delete(budget)
    db.commit()

    return {
        "message": "Budget deleted successfully",
        "budget": budget_id
    }
