import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const userData = Object.fromEntries(formData.entries());

  try {
    const endpoint = isRegister ? 'register' : 'login';

    const response = await fetch(`https://notenest-backend-6a8o.onrender.com/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    alert(result.message);
    if (response.ok && !isRegister) {
  onLogin(result.user); // Pass the full name to the onLogin callback
}

  } catch (error) {
    alert('Backend connection failed!');
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

  <button type="submit">
    {isRegister ? "Create Account →" : "Login →"}
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