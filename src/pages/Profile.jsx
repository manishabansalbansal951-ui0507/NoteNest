import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Profile.css';

function Profile({ userName, notes = [] }) {

  const [bookmarks, setBookmarks] = useState([]);

  // Load Bookmarks
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem('bookmarks') || '[]'
    );

    setBookmarks(saved);
  }, []);

  // Generate Initials
  const getInitials = () => {
    if (!userName) return 'U';

    return userName
      .trim()
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (

    <div className="profile-page">

      <div className="profile-card">

        {/* PROFILE AVATAR */}
        <div className="profile-avatar">
          {getInitials()}
        </div>

        <h1>{userName || 'User'}</h1>

        <p className="profile-role">
          🎓 NoteNest Member
        </p>

        <div className="profile-badge">
          ✨ Welcome to your Profile
        </div>

        {/* PROFILE STATS */}
        <div className="profile-stats">

          <div className="profile-stat-box">
            <span>📚</span>
            <h2>{notes.length}</h2>
            <p>My Uploaded Notes</p>
          </div>

          <div className="profile-stat-box">
            <span>❤️</span>
            <h2>{bookmarks.length}</h2>
            <p>My Bookmarks</p>
          </div>

        </div>

        {/* PROFILE ACTIONS */}
        <div className="profile-actions">

          <Link to="/upload">
            <button type="button">
              📤 Upload Notes
            </button>
          </Link>

          <Link to="/explore">
            <button type="button">
              🔍 Explore Notes
            </button>
          </Link>

        </div>

      </div>

    </div>

  );

}

export default Profile;