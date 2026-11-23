// ========================================
// 1. CHECK WHETHER THE USER IS LOGGED IN
// ========================================

const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

// Get the budget form
const budgetForm = document.getElementById("budget-form");

// Get the budgets display area
const budgetsList = document.getElementById("budgets-list");

// ========================================
// 2. GET EXPENSE CATEGORIES FROM BACKEND
// ========================================

async function getExpenseCategories() {
  try {
    const response = await fetch("http://127.0.0.1:8000/categories", {
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

      throw new Error("Could not load categories.");
    }

    const categories = await response.json();

    // Keep only Expense categories
    const expenseCategories = categories.filter(function (category) {
      return category.type === "Expense";
    });

    // Get the category dropdown
    const categoryDropdown = document.getElementById("budget-category");

    // Clear existing options
    categoryDropdown.innerHTML = '<option value="">Select category</option>';

    // Add Expense categories to the dropdown
    expenseCategories.forEach(function (category) {
      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      categoryDropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading Expense categories:", error);
    alert("Could not load Expense categories.");
  }
}

// ========================================
// 3. GET EXISTING BUDGETS
// ========================================

async function getBudgets() {
  try {
    const response = await fetch("http://127.0.0.1:8000/budgets", {
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

      throw new Error("Could not load budgets.");
    }

    const budgets = await response.json();

    // Clear the current budget display
    budgetsList.innerHTML = "";

    // Check whether the user has any budgets
    if (budgets.length === 0) {
      budgetsList.textContent = "You have not created any budgets yet.";
      return;
    }

    // Display each budget
    budgets.forEach(function (budget) {
      const budgetCard = document.createElement("article");

      budgetCard.classList.add("budget-card");

      budgetCard.innerHTML = `
        <h3>Budget #${budget.id}</h3>
        <p>Category ID: ${budget.category_id}</p>
        <p>Budget Amount: R${Number(budget.amount).toFixed(2)}</p>
        <p>Month: ${budget.month}</p>
        <p>Year: ${budget.year}</p>
      `;

      budgetsList.appendChild(budgetCard);
    });
  } catch (error) {
    console.error("Budget error:", error);
    alert("Could not load your budgets.");
  }
}

// ========================================
// 4. CREATE A NEW BUDGET
// ========================================

budgetForm.addEventListener("submit", async function (event) {
  // Stop the page from refreshing
  event.preventDefault();

  // Collect information from the form
  const categoryId = document.getElementById("budget-category").value;

  const amount = document.getElementById("budget-amount").value;

  const month = document.getElementById("budget-month").value;

  const year = document.getElementById("budget-year").value;

  // Prepare the budget data
  const budgetData = {
    category_id: Number(categoryId),
    amount: Number(amount),
    month: Number(month),
    year: Number(year),
  };

  try {
    // Send the new budget to the backend
    const response = await fetch("http://127.0.0.1:8000/budgets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
    });

    // Check whether the request was successful
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
      }

      const errorData = await response.json();

      alert(errorData.detail || "Could not save budget.");

      return;
    }

    // Show success message
    alert("Budget created successfully!");

    // Clear the form
    budgetForm.reset();

    // Reload the budgets
    getBudgets();
  } catch (error) {
    console.error("Error creating budget:", error);

    alert("Something went wrong while saving the budget.");
  }
});

// ========================================
// 5. LOGOUT
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
// 6. LOAD BUDGET PAGE DATA
// ========================================

getExpenseCategories();
getBudgets();
