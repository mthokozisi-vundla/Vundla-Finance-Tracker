// ========================================
// 1. CHECK WHETHER THE USER IS LOGGED IN
// ========================================

const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

// Store the ID of the category being edited
let editingCategoryId = null;

// Get the category form
const categoryForm = document.getElementById("category-form");

// Get the categories table
const categoriesList = document.getElementById("categories-list");

// ========================================
// 2. GET CATEGORIES FROM THE BACKEND
// ========================================

async function getCategories() {
  try {
    const response = await fetch("http://127.0.0.1:8000/categories", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Check whether the request was successful
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
      }

      throw new Error("Could not load categories.");
    }

    const categories = await response.json();

    // Clear the existing table rows
    categoriesList.innerHTML = "";

    // Display every category
    categories.forEach(function (category) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${category.name}</td>
        <td>${category.type}</td>
        <td>
          <button class="edit-category-btn">Edit</button>
          <button class="delete-category-btn">Delete</button>
        </td>
      `;

      // ========================================
      // 3. EDIT CATEGORY BUTTON
      // ========================================

      const editButton = row.querySelector(".edit-category-btn");

      editButton.addEventListener("click", function () {
        // Store the category ID
        editingCategoryId = category.id;

        // Fill the form with existing information
        document.getElementById("category-name").value = category.name;

        document.getElementById("category-type").value = category.type;

        // Change the heading
        categoryForm.previousElementSibling.textContent = "Edit Category";

        // Change the submit button text
        categoryForm.querySelector('button[type="submit"]').textContent =
          "Update Category";

        // Scroll to the form
        categoryForm.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });

      // ========================================
      // 4. DELETE CATEGORY BUTTON
      // ========================================

      const deleteButton = row.querySelector(".delete-category-btn");

      deleteButton.addEventListener("click", async function () {
        const confirmed = confirm(
          `Are you sure you want to delete "${category.name}"?`,
        );

        if (!confirmed) {
          return;
        }

        try {
          const deleteResponse = await fetch(
            `http://127.0.0.1:8000/categories/${category.id}`,
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

            alert(errorData.detail || "Could not delete category.");

            return;
          }

          alert("Category deleted successfully!");

          // Reload categories
          getCategories();
        } catch (error) {
          console.error("Error deleting category:", error);

          alert("Something went wrong while deleting the category.");
        }
      });

      // Add the row to the table
      categoriesList.appendChild(row);
    });
  } catch (error) {
    console.error("Category error:", error);

    alert("Could not load your categories.");
  }
}

// ========================================
// 5. CREATE OR UPDATE CATEGORY
// ========================================

categoryForm.addEventListener("submit", async function (event) {
  // Stop the page from refreshing
  event.preventDefault();

  // Collect information from the form
  const name = document.getElementById("category-name").value.trim();

  const type = document.getElementById("category-type").value;

  // Prepare category data
  const categoryData = {
    name: name,
    type: type,
  };

  try {
    let response;

    // Check whether we are editing or creating
    if (editingCategoryId !== null) {
      // UPDATE EXISTING CATEGORY
      response = await fetch(
        `http://127.0.0.1:8000/categories/${editingCategoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(categoryData),
        },
      );
    } else {
      // CREATE NEW CATEGORY
      response = await fetch("http://127.0.0.1:8000/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryData),
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

      alert(errorData.detail || "Could not save category.");

      return;
    }

    // Display the correct success message
    if (editingCategoryId !== null) {
      alert("Category updated successfully!");
    } else {
      alert("Category created successfully!");
    }

    // Reset the form
    categoryForm.reset();

    // Exit edit mode
    editingCategoryId = null;

    // Restore the original heading
    categoryForm.previousElementSibling.textContent = "Add New Category";

    // Restore the button text
    categoryForm.querySelector('button[type="submit"]').textContent =
      "Save Category";

    // Refresh the categories table
    getCategories();
  } catch (error) {
    console.error("Error saving category:", error);

    alert("Something went wrong. Please try again.");
  }
});

// ========================================
// 6. LOGOUT
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
// 7. RUN CATEGORY MANAGEMENT
// ========================================

getCategories();
