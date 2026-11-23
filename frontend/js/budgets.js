// ========================================
// 1. CHECK WHETHER THE USER IS LOGGED IN
// ========================================

const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

const budgetForm = document.getElementById("budget-form");
const budgetsList = document.getElementById("budgets-list");

// Store categories
let categories = [];

// Month names
const monthNames = [
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

// ========================================
// 2. GET EXPENSE CATEGORIES
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

    categories = await response.json();

    const expenseCategories = categories.filter(function (category) {
      return category.type === "Expense";
    });

    const categoryDropdown = document.getElementById("budget-category");

    categoryDropdown.innerHTML = '<option value="">Select category</option>';

    expenseCategories.forEach(function (category) {
      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      categoryDropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    alert("Could not load Expense categories.");
  }
}

// ========================================
// 3. GET AND DISPLAY BUDGETS
// ========================================

async function getBudgets() {
  try {
    // Get budgets together with their spending information
    const response = await fetch("http://127.0.0.1:8000/budgets/summary", {
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

    budgetsList.innerHTML = "";

    if (budgets.length === 0) {
      budgetsList.textContent = "You have not created any budgets yet.";
      return;
    }

    // Display each budget
    budgets.forEach(function (budget) {
      const budgetCard = document.createElement("article");

      budgetCard.classList.add("budget-card");

      // Get the category name from the backend
      const categoryName = budget.category_name;

      // Convert the month number into a month name
      const monthName = monthNames[budget.month - 1];

      // Format money values
      const budgetAmount = Number(budget.amount).toFixed(2);
      const spentAmount = Number(budget.spent).toFixed(2);
      const remainingAmount = Number(budget.remaining).toFixed(2);

      // Get the percentage used
      const percentage = Number(budget.percentage);

      // Create the budget heading
      const heading = document.createElement("h3");
      heading.textContent = `${categoryName} Budget`;

      // Create budget information
      const categoryText = document.createElement("p");
      categoryText.textContent = `Category: ${categoryName}`;

      const amountText = document.createElement("p");
      amountText.textContent = `Budget Limit: R${budgetAmount}`;

      const spentText = document.createElement("p");
      spentText.textContent = `Amount Spent: R${spentAmount}`;

      const remainingText = document.createElement("p");
      remainingText.textContent = `Remaining Balance: R${remainingAmount}`;

      const monthText = document.createElement("p");
      monthText.textContent = `Month: ${monthName}`;

      const yearText = document.createElement("p");
      yearText.textContent = `Year: ${budget.year}`;

      const percentageText = document.createElement("p");
      percentageText.textContent = `Budget Used: ${percentage.toFixed(2)}%`;

      // ========================================
      // CREATE THE PROGRESS BAR
      // ========================================

      const progressContainer = document.createElement("div");
      progressContainer.classList.add("budget-progress");

      const progressFill = document.createElement("div");
      progressFill.classList.add("budget-progress-fill");

      // Prevent the progress bar from going beyond 100%
      const progressWidth = Math.min(Math.max(percentage, 0), 100);

      progressFill.style.width = `${progressWidth}%`;

      progressContainer.appendChild(progressFill);

      // ========================================
      // CHECK THE BUDGET WARNING LEVEL
      // ========================================

      const warningText = document.createElement("p");

      if (percentage >= 100) {
        warningText.textContent =
          "Warning: You have reached or exceeded your budget limit!";
        warningText.classList.add("budget-danger");
      } else if (percentage >= 80) {
        warningText.textContent =
          "Warning: You have used 80% or more of this budget.";
        warningText.classList.add("budget-warning");
      }

      // ========================================
      // ADD EVERYTHING TO THE BUDGET CARD
      // ========================================

      budgetCard.appendChild(heading);
      budgetCard.appendChild(categoryText);
      budgetCard.appendChild(amountText);
      budgetCard.appendChild(spentText);
      budgetCard.appendChild(remainingText);
      budgetCard.appendChild(monthText);
      budgetCard.appendChild(yearText);
      budgetCard.appendChild(percentageText);
      budgetCard.appendChild(progressContainer);

      // Only display a warning when necessary
      if (percentage >= 80) {
        budgetCard.appendChild(warningText);
      }

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
  event.preventDefault();

  const categoryId = document.getElementById("budget-category").value;
  const amount = document.getElementById("budget-amount").value;
  const month = document.getElementById("budget-month").value;
  const year = document.getElementById("budget-year").value;

  const budgetData = {
    category_id: Number(categoryId),
    amount: Number(amount),
    month: Number(month),
    year: Number(year),
  };

  try {
    const response = await fetch("http://127.0.0.1:8000/budgets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
    });

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

    alert("Budget created successfully!");

    budgetForm.reset();

    // Reload budgets to show the latest spending information
    await getBudgets();
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

async function loadBudgetPage() {
  await getExpenseCategories();
  await getBudgets();
}

loadBudgetPage();
