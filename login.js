import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Initialize Firebase Auth
const auth = getAuth();

// Get the login form element
const loginForm = document.getElementById('loginForm');

// Add submit event listener to the login form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent default form submission behavior

  // Get user input values
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // Sign in user with email and password
    await signInWithEmailAndPassword(auth, email, password);

    console.log('User logged in:', email);
    alert('Login successful!');

    // Redirect user to welcome.html
    window.location.href = 'welcome.html';
  } catch (error) {
    console.error('Error logging in:', error.message);
    alert('Login failed. Please try again.');
  }
});
