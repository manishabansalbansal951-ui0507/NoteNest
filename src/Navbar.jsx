import './Navbar.css';
import { Link } from 'react-router-dom';

function Navbar({ title }) {
  return (
    <nav>
      <h2>{title}</h2>

      <div>
        <Link to="/">Home</Link>
        <Link to="/explore">Explore Notes</Link>
        <Link to="/upload">Upload Notes</Link>
        <Link to="/my-notes">My Notes</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/about">About</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;