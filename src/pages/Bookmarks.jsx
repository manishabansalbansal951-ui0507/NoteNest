import { useState, useEffect } from 'react';

function Bookmarks() {

  const [bookmarks, setBookmarks] = useState([]);
  const API_URL = 'https://notenest-backend-6a8o.onrender.com';

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem('bookmarks') || '[]'
    );

    setBookmarks(saved);
  }, []);

  // Remove Bookmark
  const removeBookmark = (id) => {

    const updated = bookmarks.filter(
      note => String(note._id || note.id) !== String(id)
    );

    setBookmarks(updated);

    localStorage.setItem(
      'bookmarks',
      JSON.stringify(updated)
    );
  };

  return (
    <div className="bookmarks-page">

      <h1>My Bookmarks ❤️</h1>

      <p>Your favourite study materials in one place.</p>

      <div className="bookmark-count">
        Saved Notes: <strong>{bookmarks.length}</strong>
      </div>

      <div className="notes-container">

        {bookmarks.length === 0 ? (

          <div className="empty-bookmarks">
            <h2>🤍 No Bookmarks Yet!</h2>
            <p>Explore notes and save your favourite study materials.</p>
          </div>

        ) : (

          bookmarks.map(note => (

            <div
              className="note-card"
              key={note._id || note.id}
            >

              <div className="note-icon">📘</div>

              <h3>{note.title}</h3>

              <p>{note.subject}</p>

              <p>{note.description}</p>

              {note.fileUrl && (
                <a
                  href={`${API_URL}${note.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button type="button">
                    View PDF →
                  </button>
                </a>
              )}

              <button
                className="remove-bookmark"
                onClick={() => removeBookmark(note._id || note.id)}
              >
                💔 Remove Bookmark
              </button>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default Bookmarks;