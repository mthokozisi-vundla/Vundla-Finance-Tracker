# Vundla-Finance Tracker

**Personal Finance Tracker**

## 1. Project Overview

Vundla Finance is a personal finance tracking application that helps users record income and expenses, manage monthly budgets, organise financial categories and monitor their spending.

## 2. Project Objectives

- Record and manage income and expenses.
- Create and manage custom categories.
- Set monthly budgets.
- Monitor spending and remaining budgets.
- View financial summaries and charts.
- Receive budget warnings.
- Provide separate User and Admin roles.

## 3. Technologies Used

- Python
- FastAPI
- HTML5
- CSS3
- JavaScript
- MySQL
- Chart.js
- Pytest

## 4. Project Features

### User Authentication

- User registration and login.
- Secure password hashing.
- JWT-based authentication.
- Protected routes requiring authentication.
- User and Admin roles.

### Transaction Management

- Record income and expenses.
- View transaction history.
- Edit and delete transactions.
- Search and filter transactions.

### Category Management

- Create custom income and expense categories.
- View, edit and delete categories.

### Budget Management

- Create monthly budgets for expense categories.
- View budget limits and amounts spent.
- Calculate remaining budget balances.
- Display budget usage percentages.
- Receive warnings when 80% or 100% of a budget is reached.

### Dashboard

- Display total income, expenses and balance.
- Monthly income and expense chart.
- Spending by category chart.

### Administration

- Admin statistics dashboard.
- Restricted access to administrative statistics.
- Administrators cannot access individual users' transactions.

## 5. Database Design

Vundla Finance uses MySQL as its relational database management system.

The database contains four main tables:

| Table        | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| users        | Stores user accounts, email addresses, hashed passwords and roles.   |
| categories   | Stores income and expense categories belonging to users.             |
| transactions | Stores income and expense records linked to users and categories.    |
| budgets      | Stores monthly budget limits linked to users and expense categories. |

### Database Relationships

- A user can have multiple categories.
- A user can have multiple transactions.
- A user can have multiple budgets.
- Each transaction belongs to a user and a category.
- Each budget belongs to a user and an expense category.

The database uses primary keys and foreign keys to maintain relationships between records.

## 6. Installation and Setup

## 6. Installation and Setup

### Prerequisites

Before installing Vundla Finance, ensure you have:

- Python 3.12 or later
- MySQL Server
- MySQL Workbench (optional, for database management)
- Visual Studio Code
- VS Code Live Server extension

### Step 1: Clone the Repository

```bash
git clone https://github.com/mthokozisi-vundla/Vundla-Finance-Tracker.git
cd Vundla-Finance-Tracker
```

### Step 2: Create the MySQL Database

Open MySQL Workbench and execute:

```sql
CREATE DATABASE vundla_finance;
```

### Step 3: Configure Environment Variables

Navigate to the `backend` folder and create a `.env` file.

Add the following variables:

```env
DB_PASSWORD=your_mysql_password
JWT_SECRET_KEY=your_secret_key
```

Replace the example values with your own credentials and a secure, randomly generated JWT secret.

### Step 4: Create a Virtual Environment

```bash
cd backend
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

### Step 5: Install Dependencies

```bash
python -m pip install -r requirements.txt
```

## 7. Running the Application

### Start the Backend

From the backend directory, run:

```bash
python -m uvicorn main:app --reload
```

The backend will be available at:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### Start the Frontend

1. Open the project folder in Visual Studio Code.
2. Open `frontend/index.html`.
3. Right-click the file.
4. Select **Open with Live Server**.

The frontend will normally be available at:

`http://127.0.0.1:5500/frontend/index.html`

### Running Automated Tests

From the backend directory, activate the virtual environment and run:

```bash
python -m pytest -v
```

## 8. Test Accounts

Users can create an account through the registration page.

The application supports two roles:

- **User:** Can manage personal transactions, categories and budgets.
- **Admin:** Has access to administrative statistics.

An administrator account must be configured with the Admin role before accessing administrative features.

For security reasons, passwords and private account credentials are not included in this repository.

## 9. Testing

## 9. Testing

Vundla Finance includes automated tests using Pytest.

The test suite covers:

- API health checks.
- User registration and login.
- Duplicate registration and incorrect passwords.
- Transaction creation and retrieval.
- User data access restrictions.
- Category and budget ownership permissions.
- Invalid and expired authentication tokens.
- User and Admin role permissions.
- Database model relationships.

### Running the Tests

Navigate to the backend directory, activate the virtual environment and run:

```bash
python -m pytest -v
```

**Test Results:** 21 tests passed successfully.

## 10. Libraries and Dependencies

The following libraries and tools are used in Vundla Finance:

### Backend

- FastAPI – Building the backend API.
- Uvicorn – Running the FastAPI application.
- SQLAlchemy – Database operations and ORM.
- PyMySQL – Connecting Python to MySQL.
- Pydantic – Data validation.
- PyJWT – JSON Web Token authentication.
- Argon2 – Secure password hashing.
- Python-dotenv – Managing environment variables.

### Frontend

- Chart.js – Displaying financial charts.
- HTML5 – Application structure.
- CSS3 – Application styling.
- JavaScript – Frontend functionality.

### Testing

- Pytest – Automated testing.
- HTTPX – API testing.

## 11. AI Assistance Declaration

AI tools were used to assist with project planning, understanding technical concepts, organising requirements and troubleshooting during development.

The application was implemented by Mthokozisi Vundla as part of the software development learning process.

AI assistance was used as a learning and support tool. The developer remains responsible for understanding, testing and maintaining the application.
