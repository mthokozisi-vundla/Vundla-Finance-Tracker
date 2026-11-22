// REGISTRATION

const registerForm = document.getElementById("register-form");
const registerMessage = document.getElementById("register-message");

if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("full-name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        registerMessage.textContent = "Account created successfully!";
        registerMessage.style.color = "green";
        registerForm.reset();
      } else {
        registerMessage.textContent = data.detail || "Registration failed.";
        registerMessage.style.color = "red";
      }

      registerMessage.style.display = "block";
    } catch (error) {
      registerMessage.textContent = "Could not connect to the server.";
      registerMessage.style.color = "red";
      registerMessage.style.display = "block";
    }
  });
}

// LOGIN

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save the login token
        localStorage.setItem("access_token", data.access_token);

        loginMessage.textContent = "Login successful!";
        loginMessage.style.color = "green";

        // Open the dashboard
        window.location.href = "dashboard.html";
      } else {
        loginMessage.textContent = data.detail || "Login failed.";
        loginMessage.style.color = "red";
      }

      loginMessage.style.display = "block";
    } catch (error) {
      loginMessage.textContent = "Could not connect to the server.";
      loginMessage.style.color = "red";
      loginMessage.style.display = "block";

      console.error("Login error:", error);
    }
  });
}
