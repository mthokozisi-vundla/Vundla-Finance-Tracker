// Check whether the user is logged in
const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

// GET TRANSACTIONS FROM BACKEND

async function getTransactions() {
  const response = await fetch("http://127.0.0.1:8000/transactions", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const transactions = await response.json();

  // Get the table body
  const transactionsList = document.getElementById("transactions-list");

  // Clear the table
  transactionsList.innerHTML = "";

  // Add each transaction to the table
  transactions.forEach(function (transaction) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${transaction.description}</td>
        <td>${transaction.category_id}</td>
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
