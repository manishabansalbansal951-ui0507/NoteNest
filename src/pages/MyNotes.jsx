import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ModernNotes.css';

function MyNotes({ notes = [], onUpdate, onDelete }) {

  const API_URL = 'http://localhost:5000';

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Search and Sort
  const filteredNotes = notes
    .filter(note =>
      `${note.title} ${note.subject}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      if (sort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      return a.title.localeCompare(b.title);
    });

  // Edit Note
  const handleEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setSubject(note.subject);
    setDescription(note.description);
  };

  // Save Changes
  const handleSave = async () => {

    const result = await onUpdate(
      editingNote._id || editingNote.id,
      { title, subject, description }
    );

    if (result?.success) {
      alert('Note updated successfully!');
      setEditingNote(null);
    } else {
      alert(result?.message || 'Update failed!');
    }
  };

  return (

    <div className="my-notes-page">

      <h1>My Notes 📚</h1>

      <p>Manage all your uploaded study materials.</p>

      {/* NOTES SUMMARY */}
      <div className="notes-summary">

        <div className="summary-icon">📖</div>

        <div>
          <h2>{notes.length}</h2>
          <p>Total Uploaded Notes</p>
        </div>

      </div>

      {/* EMPTY STATE */}
      {notes.length === 0 ? (

        <div className="empty-notes">

          <div style={{ fontSize: '65px' }}>
            📭
          </div>

          <h2>You haven't uploaded any notes yet!</h2>

          <p>
            Start sharing your study materials
            with other students.
          </p>

          <Link to="/upload">
            <button type="button">
              📤 Upload Your First Note
            </button>
          </Link>

        </div>

      ) : (

        <>

          {/* SEARCH AND SORT */}
          <div className="notes-toolbar">

            <input
              type="text"
              placeholder="🔍 Search your notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">A - Z</option>
            </select>

          </div>

          {/* NOTES CONTAINER */}
          <div className="notes-container">

            {filteredNotes.length === 0 ? (

              <p className="empty-notes">
                No matching notes found!
              </p>

            ) : (

              filteredNotes.map(note => (

                <div
                  className="note-card"
                  key={note._id || note.id}
                >

                  <div className="note-icon">📘</div>

                  <h3>{note.title}</h3>

                  <span className="subject-tag">
                    {note.subject}
                  </span>

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

                  <div className="note-actions">

                    <button onClick={() => handleEdit(note)}>
                      ✏️ Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        onDelete(note._id || note.id)
                      }
                    >
                      🗑️ Delete
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </>

      )}

      {/* EDIT MODAL */}
      {editingNote && (

        <div className="edit-modal">

          <div className="edit-modal-content">

            <h2>Edit Note</h2>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
            />

            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
            />

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description"
            />

            <button onClick={handleSave}>
              Save Changes
            </button>

            <button onClick={() => setEditingNote(null)}>
              Cancel
            </button>

          </div>

        </div>

      )}

    </div>

  );

}

export default MyNotes;