// ========================================
// 1. CHECK WHETHER THE USER IS LOGGED IN
// ========================================

const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

// ========================================
// 2. GET TRANSACTIONS FROM BACKEND
// ========================================

async function getTransactions() {
  try {
    // Get transactions from the backend
    const response = await fetch("http://127.0.0.1:8000/transactions", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
      }

      throw new Error("Could not load transactions.");
    }

    const transactions = await response.json();

    // Get categories from the backend
    const categoryResponse = await fetch("http://127.0.0.1:8000/categories", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!categoryResponse.ok) {
      throw new Error("Could not load categories.");
    }

    const categories = await categoryResponse.json();

    // ========================================
    // 3. PREPARE MONTHLY TOTALS
    // ========================================

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyIncome = Array(12).fill(0);
    const monthlyExpenses = Array(12).fill(0);

    // ========================================
    // 4. CALCULATE TOTAL INCOME AND EXPENSES
    // ========================================

    let totalIncome = 0;
    let totalExpenses = 0;

    const currentYear = new Date().getFullYear();

    transactions.forEach(function (transaction) {
      const amount = Number(transaction.amount);

      // Calculate overall totals
      if (transaction.type === "Income") {
        totalIncome += amount;
      } else if (transaction.type === "Expense") {
        totalExpenses += amount;
      }

      // Get transaction month and year
      const transactionDate = new Date(transaction.date + "T00:00:00");

      const monthIndex = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();

      // Add transaction to the correct month
      if (transactionYear === currentYear) {
        if (transaction.type === "Income") {
          monthlyIncome[monthIndex] += amount;
        } else if (transaction.type === "Expense") {
          monthlyExpenses[monthIndex] += amount;
        }
      }
    });

    // Calculate remaining balance
    const remainingBalance = totalIncome - totalExpenses;

    // ========================================
    // 5. UPDATE DASHBOARD SUMMARY CARDS
    // ========================================

    document.getElementById("total-income").textContent =
      `R${totalIncome.toFixed(2)}`;

    document.getElementById("total-expenses").textContent =
      `R${totalExpenses.toFixed(2)}`;

    document.getElementById("remaining-balance").textContent =
      `R${remainingBalance.toFixed(2)}`;

    // ========================================
    // 6. DISPLAY TRANSACTIONS IN THE TABLE
    // ========================================

    const transactionsList = document.getElementById("transactions-list");

    transactionsList.innerHTML = "";

    transactions.forEach(function (transaction) {
      // Find the matching category
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

    // ========================================
    // 7. INCOME VS EXPENSES BAR CHART
    // ========================================

    const incomeExpensesCanvas = document.getElementById(
      "income-expenses-chart",
    );

    if (incomeExpensesCanvas) {
      const incomeExpensesContext = incomeExpensesCanvas.getContext("2d");

      new Chart(incomeExpensesContext, {
        type: "bar",

        data: {
          labels: months,

          datasets: [
            {
              label: "Income",
              data: monthlyIncome,
            },
            {
              label: "Expenses",
              data: monthlyExpenses,
            },
          ],
        },

        options: {
          responsive: true,

          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }

    // ========================================
    // 8. SPENDING BY CATEGORY DOUGHNUT CHART
    // ========================================

    // Get expense transactions only
    const expenseTransactions = transactions.filter(function (transaction) {
      return transaction.type === "Expense";
    });

    // Store spending for each category
    const categorySpending = {};

    expenseTransactions.forEach(function (transaction) {
      const category = categories.find(function (category) {
        return category.id === transaction.category_id;
      });

      const categoryName = category ? category.name : "Unknown category";

      if (!categorySpending[categoryName]) {
        categorySpending[categoryName] = 0;
      }

      categorySpending[categoryName] += Number(transaction.amount);
    });

    // Convert category totals into chart arrays
    const categoryLabels = Object.keys(categorySpending);
    const categoryAmounts = Object.values(categorySpending);

    const categorySpendingCanvas = document.getElementById(
      "category-spending-chart",
    );

    if (categorySpendingCanvas) {
      const categorySpendingContext = categorySpendingCanvas.getContext("2d");

      new Chart(categorySpendingContext, {
        type: "doughnut",

        data: {
          labels: categoryLabels,

          datasets: [
            {
              label: "Spending",
              data: categoryAmounts,
            },
          ],
        },

        options: {
          responsive: true,
        },
      });
    }
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

// Run the dashboard function
getTransactions();

// ========================================
// 9. LOGOUT
// ========================================

const logoutLink = document.getElementById("logout-link");

if (logoutLink) {
  logoutLink.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.removeItem("access_token");

    window.location.href = "login.html";
  });
}
