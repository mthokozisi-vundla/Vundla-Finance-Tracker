// ========================================
// 1. CHECK WHETHER THE USER IS LOGGED IN
// ========================================

const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

// Store the ID of the transaction being edited
let editingTransactionId = null;

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

    // Get the category dropdown
    const categoryDropdown = document.getElementById("category");

    // Add categories from the database
    categories.forEach(function (category) {
      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      categoryDropdown.appendChild(option);
    });

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

    // Get the transactions table body
    const transactionsList = document.getElementById("transactions-list");

    // Clear the existing table rows
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
        <td>
          <button class="edit-transaction-btn">
            Edit
          </button>

          <button class="delete-transaction-btn">
            Delete
          </button>
        </td>
      `;

      // ========================================
      // EDIT TRANSACTION BUTTON
      // ========================================

      const editButton = row.querySelector(".edit-transaction-btn");

      editButton.addEventListener("click", function () {
        // Store the transaction ID
        editingTransactionId = transaction.id;

        // Fill the form with existing transaction information
        document.getElementById("description").value = transaction.description;

        document.getElementById("amount").value = transaction.amount;

        document.getElementById("date").value = transaction.date;

        document.getElementById("type").value = transaction.type;

        document.getElementById("category").value = transaction.category_id;

        // Change the form heading
        document.querySelector("#transaction-form h3").textContent =
          "Edit Transaction";

        // Change the submit button text
        document.querySelector(
          '#transaction-form button[type="submit"]',
        ).textContent = "Update Transaction";

        // Show the form
        transactionForm.style.display = "block";

        // Scroll to the form
        transactionForm.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });

      // ========================================
      // DELETE TRANSACTION BUTTON
      // ========================================

      const deleteButton = row.querySelector(".delete-transaction-btn");

      deleteButton.addEventListener("click", async function () {
        // Ask the user to confirm deletion
        const confirmed = confirm(
          "Are you sure you want to delete this transaction?",
        );

        if (!confirmed) {
          return;
        }

        try {
          // Send the delete request to the backend
          const deleteResponse = await fetch(
            `http://127.0.0.1:8000/transactions/${transaction.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          // Check whether deletion was successful
          if (!deleteResponse.ok) {
            if (deleteResponse.status === 401) {
              localStorage.removeItem("access_token");
              window.location.href = "login.html";
              return;
            }

            const errorData = await deleteResponse.json();

            alert(errorData.detail || "Could not delete transaction.");

            return;
          }

          // Show success message
          alert("Transaction deleted successfully!");

          // Reload dashboard
          window.location.reload();
        } catch (error) {
          console.error("Error deleting transaction:", error);

          alert("Something went wrong while deleting the transaction.");
        }
      });

      // Add row to the table
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

// ========================================
// RUN THE DASHBOARD FUNCTION
// ========================================

getTransactions();

// ========================================
// 9. SHOW AND HIDE TRANSACTION FORM
// ========================================

// Get the button and form
const addTransactionButton = document.getElementById("add-transaction-btn");

const transactionForm = document.getElementById("transaction-form");

const cancelTransactionButton = document.getElementById(
  "cancel-transaction-btn",
);

// Show the form when Add Transaction is clicked
addTransactionButton.addEventListener("click", function () {
  // Make sure we are in Add mode
  editingTransactionId = null;

  transactionForm.reset();

  document.querySelector("#transaction-form h3").textContent =
    "Add New Transaction";

  document.querySelector(
    '#transaction-form button[type="submit"]',
  ).textContent = "Save Transaction";

  transactionForm.style.display = "block";
});

// Hide the form when Cancel is clicked
cancelTransactionButton.addEventListener("click", function () {
  transactionForm.style.display = "none";

  // Exit edit mode
  editingTransactionId = null;

  transactionForm.reset();

  document.querySelector("#transaction-form h3").textContent =
    "Add New Transaction";

  document.querySelector(
    '#transaction-form button[type="submit"]',
  ).textContent = "Save Transaction";
});

// ========================================
// 10. SAVE OR UPDATE A TRANSACTION
// ========================================

// Get the transaction form
const transactionFormElement = document.getElementById("transaction-form");

// Listen for form submission
transactionFormElement.addEventListener("submit", async function (event) {
  // Stop the page from refreshing automatically
  event.preventDefault();

  // Collect information from the form
  const description = document.getElementById("description").value;
  const amount = Number(document.getElementById("amount").value);
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;
  const categoryId = Number(document.getElementById("category").value);

  // Prepare the transaction data
  const transactionData = {
    description: description,
    amount: amount,
    date: date,
    type: type,
    category_id: categoryId,
  };

  try {
    let response;

    // Check whether we are editing or creating
    if (editingTransactionId !== null) {
      // ========================================
      // UPDATE EXISTING TRANSACTION
      // ========================================

      response = await fetch(
        `http://127.0.0.1:8000/transactions/${editingTransactionId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(transactionData),
        },
      );
    } else {
      // ========================================
      // CREATE NEW TRANSACTION
      // ========================================

      response = await fetch("http://127.0.0.1:8000/transactions", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(transactionData),
      });
    }

    // Check whether the request was successful
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
      }

      const errorData = await response.json();

      alert(errorData.detail || "Could not save transaction.");

      return;
    }

    // Show the correct success message
    if (editingTransactionId !== null) {
      alert("Transaction updated successfully!");
    } else {
      alert("Transaction added successfully!");
    }

    // Reset the form
    transactionFormElement.reset();

    // Exit edit mode
    editingTransactionId = null;

    // Refresh dashboard
    window.location.reload();
  } catch (error) {
    console.error("Error saving transaction:", error);

    alert("Something went wrong. Please try again.");
  }
});

// ========================================
// 11. LOGOUT
// ========================================

const logoutLink = document.getElementById("logout-link");

if (logoutLink) {
  logoutLink.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.removeItem("access_token");

    window.location.href = "login.html";
  });
}
