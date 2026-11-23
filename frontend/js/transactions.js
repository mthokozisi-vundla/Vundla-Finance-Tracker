// ========================================
// 1. CHECK WHETHER THE USER IS LOGGED IN
// ========================================

const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

// Store transaction information
let allTransactions = [];
let allCategories = [];
let editingTransactionId = null;

// ========================================
// 2. GET TRANSACTIONS AND CATEGORIES
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

    allTransactions = await response.json();

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

    allCategories = await categoryResponse.json();

    // Load categories into the dropdown
    const categoryDropdown = document.getElementById("category");

    allCategories.forEach(function (category) {
      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      categoryDropdown.appendChild(option);
    });

    // Display transactions
    displayTransactions(allTransactions, allCategories);
  } catch (error) {
    console.error("Transactions error:", error);
  }
}

// ========================================
// 3. DISPLAY TRANSACTIONS
// ========================================

function displayTransactions(transactions, categories) {
  const transactionsList = document.getElementById("transactions-list");

  // Clear existing rows
  transactionsList.innerHTML = "";

  // Check whether transactions exist
  if (transactions.length === 0) {
    transactionsList.innerHTML = `
      <tr>
        <td colspan="6">No transactions found.</td>
      </tr>
    `;

    return;
  }

  // Display each transaction
  transactions.forEach(function (transaction) {
    // Find the matching category
    const category = categories.find(function (category) {
      return category.id === transaction.category_id;
    });

    // Create a table row
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${transaction.description}</td>
      <td>${category ? category.name : "Unknown category"}</td>
      <td>${transaction.date}</td>
      <td>${transaction.type}</td>
      <td>R${Number(transaction.amount).toFixed(2)}</td>
      <td>
        <button class="edit-transaction-btn">Edit</button>
        <button class="delete-transaction-btn">Delete</button>
      </td>
    `;

    // ========================================
    // 4. EDIT TRANSACTION BUTTON
    // ========================================

    const editButton = row.querySelector(".edit-transaction-btn");

    editButton.addEventListener("click", function () {
      // Store the transaction ID
      editingTransactionId = transaction.id;

      // Fill the form with existing information
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
    // 5. DELETE TRANSACTION BUTTON
    // ========================================

    const deleteButton = row.querySelector(".delete-transaction-btn");

    deleteButton.addEventListener("click", async function () {
      // Confirm deletion
      const confirmed = confirm(
        "Are you sure you want to delete this transaction?",
      );

      if (!confirmed) {
        return;
      }

      try {
        // Send delete request to the backend
        const deleteResponse = await fetch(
          `http://127.0.0.1:8000/transactions/${transaction.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

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

        alert("Transaction deleted successfully!");

        // Reload the page
        window.location.reload();
      } catch (error) {
        console.error("Error deleting transaction:", error);

        alert("Something went wrong while deleting the transaction.");
      }
    });

    // Add row to the table
    transactionsList.appendChild(row);
  });
}

// ========================================
// 6. SHOW AND HIDE TRANSACTION FORM
// ========================================

const addTransactionButton = document.getElementById("add-transaction-btn");

const transactionForm = document.getElementById("transaction-form");

const cancelTransactionButton = document.getElementById(
  "cancel-transaction-btn",
);

// Show the form
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

// Hide the form
cancelTransactionButton.addEventListener("click", function () {
  transactionForm.style.display = "none";

  editingTransactionId = null;

  transactionForm.reset();

  document.querySelector("#transaction-form h3").textContent =
    "Add New Transaction";

  document.querySelector(
    '#transaction-form button[type="submit"]',
  ).textContent = "Save Transaction";
});

// ========================================
// 7. SAVE OR UPDATE TRANSACTION
// ========================================

transactionForm.addEventListener("submit", async function (event) {
  // Stop the page from refreshing automatically
  event.preventDefault();

  // Collect information from the form
  const transactionData = {
    description: document.getElementById("description").value,
    amount: Number(document.getElementById("amount").value),
    date: document.getElementById("date").value,
    type: document.getElementById("type").value,
    category_id: Number(document.getElementById("category").value),
  };

  try {
    let response;

    // Check whether we are editing or creating
    if (editingTransactionId !== null) {
      // Update existing transaction
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
      // Create new transaction
      response = await fetch("http://127.0.0.1:8000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });
    }

    // Check whether the request succeeded
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

    // Show success message
    if (editingTransactionId !== null) {
      alert("Transaction updated successfully!");
    } else {
      alert("Transaction added successfully!");
    }

    // Reload the page
    window.location.reload();
  } catch (error) {
    console.error("Error saving transaction:", error);

    alert("Something went wrong. Please try again.");
  }
});

// ========================================
// 8. SEARCH TRANSACTIONS
// ========================================

const transactionSearch = document.getElementById("transaction-search");

transactionSearch.addEventListener("input", function () {
  const searchValue = transactionSearch.value.toLowerCase();

  // Find transactions matching the search
  const filteredTransactions = allTransactions.filter(function (transaction) {
    const category = allCategories.find(function (category) {
      return category.id === transaction.category_id;
    });

    const description = transaction.description.toLowerCase();

    const categoryName = category ? category.name.toLowerCase() : "";

    return (
      description.includes(searchValue) || categoryName.includes(searchValue)
    );
  });

  displayTransactions(filteredTransactions, allCategories);
});

// ========================================
// 9. FILTER TRANSACTIONS BY TYPE
// ========================================

const transactionTypeFilter = document.getElementById(
  "transaction-type-filter",
);

transactionTypeFilter.addEventListener("change", function () {
  const selectedType = transactionTypeFilter.value;

  let filteredTransactions = allTransactions;

  // Filter by Income or Expense
  if (selectedType !== "") {
    filteredTransactions = allTransactions.filter(function (transaction) {
      return transaction.type === selectedType;
    });
  }

  // Apply the search term as well
  const searchValue = transactionSearch.value.toLowerCase();

  filteredTransactions = filteredTransactions.filter(function (transaction) {
    const category = allCategories.find(function (category) {
      return category.id === transaction.category_id;
    });

    const description = transaction.description.toLowerCase();

    const categoryName = category ? category.name.toLowerCase() : "";

    return (
      description.includes(searchValue) || categoryName.includes(searchValue)
    );
  });

  displayTransactions(filteredTransactions, allCategories);
});

// ========================================
// 10. LOGOUT
// ========================================

const logoutLink = document.getElementById("logout-link");

if (logoutLink) {
  logoutLink.addEventListener("click", function (event) {
    event.preventDefault();

    localStorage.removeItem("access_token");

    window.location.href = "login.html";
  });
}

// ========================================
// 11. RUN THE FUNCTION
// ========================================

getTransactions();
