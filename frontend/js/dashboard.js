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
