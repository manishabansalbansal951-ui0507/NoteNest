import { useState, useEffect } from 'react';

function ExploreNotes({ notes = [] }) {

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedNote, setSelectedNote] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [downloadCounts, setDownloadCounts] = useState({});

  const API_URL = 'https://notenest-backend-6a8o.onrender.com';

  // Load Bookmarks
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem('bookmarks') || '[]'
    );
    setBookmarks(saved);
  }, []);

  // Save / Remove Bookmark
  const toggleBookmark = (note) => {

    const noteId = String(note._id || note.id);

    const alreadySaved = bookmarks.some(
      item => String(item._id || item.id) === noteId
    );

    const updatedBookmarks = alreadySaved
      ? bookmarks.filter(
          item => String(item._id || item.id) !== noteId
        )
      : [...bookmarks, note];

    setBookmarks(updatedBookmarks);

    localStorage.setItem(
      'bookmarks',
      JSON.stringify(updatedBookmarks)
    );
  };

  // DOWNLOAD PDF
  const handleDownload = async (note) => {

    try {

      const noteId = note._id || note.id;

      // Update download count
      const response = await fetch(
        `${API_URL}/notes/${noteId}/download`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Download failed!');
        return;
      }

      setDownloadCounts(prev => ({
        ...prev,
        [noteId]: result.downloadCount
      }));

      // Fetch PDF file
      const pdfResponse = await fetch(
        `${API_URL}${note.fileUrl}`
      );

      if (!pdfResponse.ok) {
        alert('PDF file not found!');
        return;
      }

      const blob = await pdfResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = note.fileName || 'NoteNest.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {

      console.log('Download Error:', error);
      alert('PDF download failed!');

    }
  };

  // Subjects
  const subjects = [
    'All',
    ...new Set(notes.map(note => note.subject).filter(Boolean))
  ];

  // Search and Filter
  const filteredNotes = notes.filter(note => {

    const matchesSearch =
      `${note.title} ${note.subject}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesSubject =
      selectedSubject === 'All' ||
      note.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  return (

    <div className="explore-page">

      <h1>Explore Notes 📚</h1>

      <p>Discover study materials shared by students.</p>

      <p>❤️ Your Bookmarks: {bookmarks.length}</p>

      <input
        type="text"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      <select
        value={selectedSubject}
        onChange={e => setSelectedSubject(e.target.value)}
      >

        {subjects.map(subject => (
          <option key={subject} value={subject}>
            {subject}
          </option>
        ))}

      </select>

      <div className="notes-container">

        {filteredNotes.length === 0 ? (

          <p>No matching notes found!</p>

        ) : (

          filteredNotes.map(note => {

            const noteId = String(note._id || note.id);

            const isBookmarked = bookmarks.some(
              item => String(item._id || item.id) === noteId
            );

            return (

              <div className="note-card" key={noteId}>

                <div className="note-icon">📘</div>

                <h3>{note.title}</h3>

                <p>{note.subject}</p>

                <p>{note.description}</p>

                <p>
                  📥 Downloads: {
                    downloadCounts[noteId] ?? note.downloadCount ?? 0
                  }
                </p>

                <button onClick={() => toggleBookmark(note)}>
                  {isBookmarked
                    ? '❤️ Bookmarked'
                    : '🤍 Add Bookmark'}
                </button>

                {note.fileUrl && (
                  <>

                    <a
                      href={`${API_URL}${note.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button type="button">
                        View PDF →
                      </button>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDownload(note)}
                    >
                      📥 Download PDF
                    </button>

                  </>
                )}

                <button onClick={() => setSelectedNote(note)}>
                  View Details
                </button>

              </div>

            );
          })

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