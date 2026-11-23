// Check whether the user is logged in
const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

// GET TRANSACTIONS FROM BACKEND

// GET TRANSACTIONS FROM BACKEND

async function getTransactions() {
  // Get transactions from the backend
  const response = await fetch("http://127.0.0.1:8000/transactions", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const transactions = await response.json();

  // Get categories from the backend
  const categoryResponse = await fetch("http://127.0.0.1:8000/categories", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const categories = await categoryResponse.json();
  // Calculate total income and expenses
  let totalIncome = 0;
  let totalExpenses = 0;

  // Go through every transaction
  transactions.forEach(function (transaction) {
    if (transaction.type === "Income") {
      totalIncome += Number(transaction.amount);
    } else if (transaction.type === "Expense") {
      totalExpenses += Number(transaction.amount);
    }
  });

  // Calculate remaining balance
  const remainingBalance = totalIncome - totalExpenses;

  // Update the dashboard cards
  document.getElementById("total-income").textContent =
    `R${totalIncome.toFixed(2)}`;

  document.getElementById("total-expenses").textContent =
    `R${totalExpenses.toFixed(2)}`;

  document.getElementById("remaining-balance").textContent =
    `R${remainingBalance.toFixed(2)}`;

  // Get the table body
  const transactionsList = document.getElementById("transactions-list");

  // Clear the table
  transactionsList.innerHTML = "";

  // Add each transaction to the table
  transactions.forEach(function (transaction) {
    // Find the category that matches this transaction
    const category = categories.find(function (category) {
      return category.id === transaction.category_id;
    });

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${transaction.description}</td>
      <td>${category ? category.name : "Unknown category"}</td>
      <td>${transaction.date}</td>
      <td>${transaction.type}</td>
      <td>R${Number(transaction.amount).toFixed(2)}</td>
    `;

    transactionsList.appendChild(row);
  });
}

getTransactions();

//------------------
// 1. Income vs Expense Chart
//-----------------

//Get the canvas element from the Html page
const incomeExpensesCanvas = document.getElementById("income-expenses-chart");

//Get the drawing context from the canvas
const incomeExpensescontent = incomeExpensesCanvas.getContext("2d");

//Create the Income vs Expenses chart
const incomeExpensesChart = new Chart(incomeExpensescontent, {
  type: "bar",

  data: {
    labels: ["January", "February", "March"],

    datasets: [
      {
        label: "Income",
        data: [12000, 15000, 18000],
      },
      {
        label: "Expenses",
        data: [4500, 6000, 7500],
      },
    ],
  },

  options: {
    responsive: true,

    scale: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

//-------------
// 2. Spending by Category Chart
//------------

//Get the category spending canvas
const categorySpendingCanvas = document.getElementById(
  "category-spending-chart",
);

//Get the drawing context
const categorySpendingContext = categorySpendingCanvas.getContext("2d");
//Create the spending by Category chart
const categorySpendingChart = new Chart(categorySpendingContext, {
  type: "doughnut",

  data: {
    labels: ["Food", "Transport", "Entertainment", "Rent"],

    datasets: [
      {
        label: "Spending",
        data: [2000, 1000, 500, 4000],
      },
    ],
  },

  options: {
    responsive: true,
  },
});

// LOGOUT

const logoutLink = document.getElementById("logout-link");

logoutLink.addEventListener("click", function (event) {
  event.preventDefault();

  localStorage.removeItem("access_token");

  window.location.href = "login.html";
});
