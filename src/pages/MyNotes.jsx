function MyNotes({ notes, onEdit, onDelete }) {
  return (
    <div className="my-notes-page">
      <h1>My Notes</h1>
      <p>Manage all your uploaded notes here.</p>

      <div className="notes-container">
        {notes.length === 0 ? (
          <p>No notes available yet!</p>
        ) : (
          notes.map((note) => (
            <div className="note-card" key={note.id}>
              <h3>{note.title}</h3>
              <p>{note.subject}</p>
              <p>{note.description}</p>

              <button onClick={() => onEdit(note)}>
                Edit
              </button>

              <button onClick={() => onDelete(note.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyNotes;