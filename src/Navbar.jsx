import './Navbar.css';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Navbar({ title }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const notifications = JSON.parse(
        localStorage.getItem('notifications') || '[]'
      );

      setUnreadCount(
        notifications.filter(item => !item.read).length
      );
    };

    updateCount();
    const interval = setInterval(updateCount, 1000);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Explore Notes', path: '/explore' },
    { name: 'Upload Notes', path: '/upload' },
    { name: 'My Notes', path: '/my-notes' },
    { name: '❤️ Bookmarks', path: '/bookmarks' },
    { name: 'Profile', path: '/profile' },
    { name: 'About', path: '/about' },
    { name: 'Login', path: '/login' }
  ];

  return (
    <nav className="main-navbar">

      <NavLink to="/" className="navbar-brand">
        <span className="brand-icon">📚</span>
        {title || 'NoteNest'}
      </NavLink>

      <div className="navbar-links">

        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            {item.name}
          </NavLink>
        ))}

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            isActive
              ? 'nav-link notification-link active'
              : 'nav-link notification-link'
          }
        >
          🔔 Notifications

          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount}
            </span>
          )}
        </NavLink>

      </div>
    </nav>
  );
}

export default Navbar;