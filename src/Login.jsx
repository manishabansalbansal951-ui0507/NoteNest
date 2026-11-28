import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());

    try {
      setLoading(true);

      const endpoint = isRegister ? 'register' : 'login';

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Something went wrong!');
        return;
      }

      if (isRegister) {
        alert(result.message || 'Registration successful! Please login.');
        setIsRegister(false);
        e.target.reset();
      } else {
        // Save JWT token
        localStorage.setItem('token', result.token);

        // Save user details
        localStorage.setItem('userId', result.user.id);
        localStorage.setItem('userName', result.user.fullName);
        localStorage.setItem('isLoggedIn', 'true');

        alert(result.message || 'Login successful!');

        // Send user details to App.jsx
        onLogin(result.user);
      }

    } catch (error) {
      console.error('Login Error:', error);
      alert('Backend connection failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-left">

        <span className="login-tag">WELCOME TO NOTENEST</span>

        <h1>
          Learn Better.
          <br />
          <span>Grow Together.</span>
        </h1>

        <p>
          Your learning journey starts here.
          Explore notes, share knowledge and connect
          with fellow students.
        </p>

        <div className="login-features">
          <div>✓ Quality Study Notes</div>
          <div>✓ Share Your Knowledge</div>
          <div>✓ Learn Together</div>
        </div>

      </div>

      <div className="login-right">

        <div className="login-container">

          <div className="login-logo">N</div>

          <h2>
            {isRegister ? "Create Account" : "Welcome Back!"}
          </h2>

          <p className="login-subtitle">
            {isRegister
              ? "Create your NoteNest account"
              : "Login to continue your learning journey"}
          </p>

          <form onSubmit={handleSubmit}>

            {isRegister && (
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                required
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
            />

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create Account →"
                  : "Login →"}
            </button>

          </form>

          <p
            className="register-link"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;