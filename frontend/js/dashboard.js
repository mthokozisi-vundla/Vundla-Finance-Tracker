//Get the canvas element from the Html page
const incomeExpensesCanvas = document.getElementById("income-expenses-chart");

//Get the drawing context from the canvas
const incomeExpensescontent = incomeExpensesCanvas.getContext("2d");

//Create the Income vs Expenses chart
const incomeExpensesChart = new Chart(incomeExpensescontent, {

    type:"bar",

    data: {
        labels: ["January", "February","March"],

        datasets: [
            {
                label: "Income",
                data: [12000, 15000, 18000]
            },
            {
                label: "Expenses",
                data: [12000, 15000, 18000]
            }
            
        ]
    }
,},

 options: {
    responsive:true,
    scales: {
        y: {
            beginAtZero:true
        }
      }
    }
);    
