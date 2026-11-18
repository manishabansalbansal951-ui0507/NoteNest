import { useState } from 'react';

function ExploreNotes({ notes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedNote, setSelectedNote] = useState(null);

  const subjects = [
    'All',
    ...new Set(notes.map((note) => note.subject))
  ];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesSubject =
      selectedSubject === 'All' ||
      note.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="explore-page">
      <h1>Explore Notes</h1>
      <p>Discover study materials shared by students.</p>

      <input
        type="text"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <select
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
      >
        {subjects.map((subject) => (
          <option key={subject} value={subject}>
            {subject}
          </option>
        ))}
      </select>

      <div className="notes-container">
        {filteredNotes.length === 0 ? (
          <p>No matching notes found!</p>
        ) : (
          filteredNotes.map((note) => (
            <div className="note-card" key={note.id}>
              <h3>{note.title}</h3>
              <p>{note.subject}</p>
              <p>{note.description}</p>

              {note.fileName && (
                <button
                  onClick={() =>
                    window.open(
                      `http://localhost:5000/uploads/${note.fileName}`,
                      '_blank'
                    )
                  }
                >
                  View PDF
                </button>
              )}
               <button
                  onClick={() => {
                    const link = document.createElement('a');

                    link.href = `http://localhost:5000/uploads/${note.fileName}?download=true`;
                    link.download = note.fileName;

                    link.click();
                  }}
                >
                  Download PDF
                </button>
              <button onClick={() => setSelectedNote(note)}>
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {selectedNote && (
        <div className="note-popup-overlay">
          <div className="note-popup">
            <button
              className="close-popup"
              onClick={() => setSelectedNote(null)}
            >
              ×
            </button>

            <h2>{selectedNote.title}</h2>
            <h4>{selectedNote.subject}</h4>
            <p>{selectedNote.description}</p>

            <button onClick={() => setSelectedNote(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExploreNotes;