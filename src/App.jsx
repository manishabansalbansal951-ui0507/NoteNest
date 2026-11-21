import Navbar from './Navbar';
import './App.css';
import { useState, useEffect } from 'react';
import Login from './Login';
import heroImage from './assets/hero.png';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ExploreNotes from './pages/ExploreNotes';
import UploadNotes from './pages/UploadNotes';
import MyNotes from './pages/MyNotes';
import Profile from './pages/Profile';
import About from './pages/About';

function App() {
  const navigate = useNavigate();

  const [count, setCount] = useState(0);
 const [userName, setUserName] = useState(
  localStorage.getItem("userName") || ""
);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Load Notes
 const [notes, setNotes] = useState([]);
   useEffect(() => {
  const fetchNotes = async () => {
  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setNotes([]);
      return;
    }

    const response = await fetch(
      `https://notenest-backend-6a8o.onrender.com/notes?userId=${userId}`
    );

    const data = await response.json();

    setNotes(data);
  } catch (error) {
    console.log("Error fetching notes:", error);
  }
};

  fetchNotes();
}, [isLoggedIn]);
 

  // Add or Update Note
  const addNote = () => {
    if (!isLoggedIn) {
      alert("Please login first to add notes!");
      return;
    }

    if (!newTitle || !newSubject || !newDescription) {
      alert("Please fill all fields!");
      return;
    }

    if (editingNoteId !== null) {
      const updatedNotes = notes.map((note) =>
        note.id === editingNoteId
          ? {
              ...note,
              title: newTitle,
              subject: newSubject,
              description: newDescription
            }
          : note
      );

      setNotes(updatedNotes);
      setEditingNoteId(null);

    } else {
      const newNote = {
        id: Date.now(),
        title: newTitle,
        subject: newSubject,
        description: newDescription
      };

      setNotes([...notes, newNote]);
    }

    setNewTitle("");
    setNewSubject("");
    setNewDescription("");
  };

  // Edit Note
  const editNote = (note) => {
    setNewTitle(note.title);
    setNewSubject(note.subject);
    setNewDescription(note.description);
    setEditingNoteId(note.id);
     
    navigate("/");

  setTimeout(() => {
    document.querySelector(".add-note-section")?.scrollIntoView({
      behavior: "smooth"
    });
  },300);
};

  // Delete Note
  const deleteNote = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this note?"
  );

  if (confirmDelete) {
    try {
      const response = await fetch(
        `https://notenest-backend-6a8o.onrender.com/notes/${id}`,
        {
          method: 'DELETE'
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message);
        return;
      }

      const updatedNotes = notes.filter(
        (note) => note.id !== id
      );

      setNotes(updatedNotes);

      alert("Note deleted successfully!");

    } catch (error) {
      alert("Delete failed! Please check your backend.");
    }
  }
};

  const handleUpload = (note) => {
  if (!isLoggedIn) {
    alert("Please login first!");
    navigate("/login");
    return;
  }

  setNotes((prevNotes) => [
    ...prevNotes,
    { ...note, id: Date.now() }
  ]);

  alert("Note uploaded successfully!");
  navigate("/my-notes");
};

  // Search and Filter Notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesSubject =
      selectedSubject === "All" || note.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    setNotes([]);

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");

    navigate("/login");
};

  return (
    <Routes>

      {/* Login Page */}
      <Route
        path="/login"
        element={
          <Login
            onLogin={(user) => {
              setIsLoggedIn(true);
              localStorage.setItem("isLoggedIn", "true");

              setUserName(user.fullName);
              localStorage.setItem("userName", user.fullName);

              localStorage.setItem("userId", user.id);

              navigate("/");
            }}
          />
        }
      />

              <Route
          path="/explore"
          element={
            <>
              <Navbar title="NoteNest" />
              <ExploreNotes notes={notes} />
            </>
          }
        />
        

              <Route
        path="/upload"
        element={
          <>
            <Navbar title="NoteNest" />
            <UploadNotes onUpload={handleUpload} />
          </>
        }
      />

            <Route
        path="/my-notes"
        element={
          <>
            <Navbar title="NoteNest" />
           <MyNotes
              notes={notes}
              onEdit={editNote}
              onDelete={deleteNote}
            />
          </>
        }
      />


      <Route
        path="/profile"
        element={
          <>
            <Navbar title="NoteNest" />
            <Profile userName={userName} notes={notes} />
          </>
        }
      />

      <Route
      path="/about"
      element={
        <>
          <Navbar title="NoteNest" />
          <About />
        </>
      }s
    />
    <Route
  path="/"
  element={
    <Navigate
      to={isLoggedIn ? "/home" : "/login"}
      replace
    />
  }
/>
      {/* Home Page */}
      <Route
        path="/home"
        element={
          <div>
            <Navbar title="NoteNest" />

            <main className="home-content">

              {/* Hero Section */}
              <section className="hero-section">

                <div className="hero-text">
                  <span className="hero-tag">YOUR LEARNING SPACE</span>

                  <h1>
                    Make Learning <span>Simple & Smarter.</span>
                  </h1>

                  <p>
                    Explore quality study notes, share your knowledge
                    and grow together with a community of learners.
                  </p>

                  <button
                    onClick={() =>
                      document.getElementById("notes")?.scrollIntoView({
                        behavior: "smooth"
                      })
                    }
                  >
                    Explore Notes →
                  </button>
                </div>

                <div className="hero-image">
                  <img src={heroImage} alt="Students learning" />
                </div>

              </section>

              {/* Statistics Section */}
              <section className="stats-grid">

                <div className="stat-card">
                  <div className="stat-icon">♡</div>
                  <div>
                    <h2>{count}</h2>
                    <p>Total Likes</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👤</div>
                  <div>
                    <h3>
                      {isLoggedIn
                        ? `Welcome, ${userName}!`
                        : "Join NoteNest"}
                    </h3>
                    <p>
                      {isLoggedIn
                        ? "You are logged in"
                        : "Start your learning journey"}
                    </p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div>
                    <h3>Study Resources</h3>
                    <p>Learn • Share • Grow</p>
                  </div>
                </div>

              </section>

              {/* Add New Note Section */}
              <section className="add-note-section">

                <div className="form-heading">
                  <span>SHARE YOUR KNOWLEDGE</span>
                  <h2>Add New Note</h2>
                  <p>Share your study material with other students.</p>
                </div>

                <div className="form-fields">

                  <div className="input-row">

                    <input
                      type="text"
                      placeholder="Enter note title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />

                    <input
                      type="text"
                      placeholder="Enter subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                    />

                  </div>

                  <textarea
                    placeholder="Write a short description..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />

                  <button onClick={addNote}>
                    {editingNoteId !== null ? "Update Note" : "+ Add Note"}
                  </button>

                </div>
              </section>

              {/* Available Notes Section */}
              <section className="available-notes" id="notes">

                <div className="notes-heading">
                  <span>EXPLORE RESOURCES</span>
                  <h2>Available Notes</h2>
                  <p>Find study material and learn something new.</p>
                </div>

                {/* Search and Filter */}
                <div className="notes-filter">

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
                    <option value="All">All Subjects</option>
                    <option value="Database Management">Database Management</option>
                    <option value="Design and Analysis">Design and Analysis</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Programming">Programming</option>
                    <option value="Networking">Networking</option>
                  </select>

                </div>

                {/* Notes Cards */}
                <div className="notes-container">

                  {filteredNotes.length > 0 ? (

                    filteredNotes.map((note) => (
                      <div className="note-card" key={note.id}>

                        <div className="note-icon">📘</div>

                        <h3>{note.title}</h3>

                        <span className="note-subject">
                          {note.subject}
                        </span>

                        <p>{note.description}</p>

                        <button onClick={() => {
                          alert(
                            `Title: ${note.title}\nSubject: ${note.subject}\n\nDescription: ${note.description}`
                          );
                        }}>
                          View Notes →
                        </button>

                        <button onClick={() => editNote(note)}>
                          ✏️ Edit
                        </button>

                        <button onClick={() => deleteNote(note.id)}>
                          🗑️ Delete
                        </button>

                      </div>
                    ))

                  ) : (

                    <p className="no-notes">
                      No notes found. Try another search!
                    </p>

                  )}

                </div>
              </section>

              {/* Login and Like Buttons */}
              <div className="bottom-buttons">

                <button onClick={() => {
                  if (isLoggedIn) {
                    handleLogout();
                  } else {
                    navigate("/login");
                  }
                }}>
                  {isLoggedIn ? "Logout" : "Login"}
                </button>

                <button onClick={() => setCount(count + 1)}>
                  Like ♡
                </button>

              </div>

            </main>
          </div>
        }
      />

    </Routes>
  );
}

export default App;