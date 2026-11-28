import Navbar from './Navbar';
import './App.css';
import { useState, useEffect } from 'react';
import Login from './Login';
import heroImage from './assets/hero.png';
import Bookmarks from './pages/Bookmarks';
import Notifications from './pages/Notifications';
import {
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';

import ExploreNotes from './pages/ExploreNotes';
import UploadNotes from './pages/UploadNotes';
import MyNotes from './pages/MyNotes';
import Profile from './pages/Profile';
import About from './pages/About';

function App() {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  // STATES
  const [count, setCount] = useState(0);

  const [userName, setUserName] = useState(
    localStorage.getItem('userName') || ''
  );

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isLoggedIn') === 'true'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  const [notes, setNotes] = useState([]);
  const [myNotes, setMyNotes] = useState([]);

  // ADD NOTIFICATION
const addNotification = (title, message) => {
  const oldNotifications = JSON.parse(
    localStorage.getItem('notifications') || '[]'
  );

  const newNotification = {
    id: Date.now(),
    title: title,
    message: message,
    date: new Date().toLocaleString(),
    read: false
  };

  localStorage.setItem(
    'notifications',
    JSON.stringify([newNotification, ...oldNotifications])
  );
};

  // FORMAT NOTES
  const formatNotes = (items) =>
    items.map((note) => ({
      ...note,
      id: note._id || note.id
    }));

  // FETCH ALL NOTES
  const fetchNotes = async () => {
    try {
      // Public notes
      const response = await fetch(`${API_URL}/notes`);
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setNotes(formatNotes(data));
      } else {
        console.log('Could not load notes:', data.message);
      }

      // User's personal notes
      const token = localStorage.getItem('token');

      if (token) {
        const myResponse = await fetch(`${API_URL}/my-notes`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const myData = await myResponse.json();

        if (myResponse.ok && Array.isArray(myData)) {
          setMyNotes(formatNotes(myData));
        } else {
          setMyNotes([]);
          console.log('Could not load My Notes:', myData.message);
        }
      } else {
        setMyNotes([]);
      }

    } catch (error) {
      console.log('Error fetching notes:', error);
    }
  };

  // LOAD NOTES WHEN LOGIN STATUS CHANGES
  useEffect(() => {
    fetchNotes();
  }, [isLoggedIn]);

  // UPDATE NOTE
  const updateNote = async (id, updatedData) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return {
          success: false,
          message: 'Please login first!'
        };
      }

      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify(updatedData)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Update failed!'
        };
      }

      await fetchNotes();

      return {
        success: true
      };

    } catch (error) {
      console.log('Update error:', error);

      return {
        success: false,
        message: 'Backend connection failed!'
      };
    }
  };

  // DELETE NOTE
  const deleteNote = async (id) => {

    if (!id) {
      alert('Note ID not found!');
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this note?'
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Please login first!');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',

        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Could not delete note.');
        return;
      }

      await fetchNotes();

        addNotification(
        'Note Deleted',
        'Your note has been successfully deleted.'
        );

        alert('Note deleted successfully!');

    } catch (error) {
      console.log('Delete error:', error);
      alert('Delete failed! Please check your backend.');
    }
  };

  // UPLOAD NOTE
  const handleUpload = async () => {

    if (!isLoggedIn) {
      alert('Please login first!');
      navigate('/login');
      return;
    }

    await fetchNotes();

        addNotification(
        'Note Uploaded',
        'Your study material has been successfully uploaded!'
        );

        alert('Note uploaded successfully!');

        navigate('/my-notes');
  };

  // SEARCH AND FILTER NOTES
  const filteredNotes = notes.filter((note) => {

    const matchesSearch = (note.title || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesSubject =
      selectedSubject === 'All' ||
      note.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  // CHECK NOTE OWNER
  const isNoteOwner = (note) => {

    const currentUserId = localStorage.getItem('userId');

    const ownerId =
      typeof note.uploadedBy === 'object'
        ? note.uploadedBy?._id || note.uploadedBy?.id
        : note.uploadedBy;

    return Boolean(
      currentUserId &&
      ownerId &&
      String(currentUserId) === String(ownerId)
    );
  };

  // LOGOUT
  const handleLogout = () => {

    setIsLoggedIn(false);
    setUserName('');
    setNotes([]);
    setMyNotes([]);

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');

    navigate('/login');
  };

  return (

    <Routes>

      {/* LOGIN PAGE */}

      <Route
        path="/login"
        element={
          <Login
            onLogin={(user) => {

              setIsLoggedIn(true);
              setUserName(user.fullName);

              addNotification(
                    'Welcome to NoteNest!',
                    `Hello ${user.fullName}, you have successfully logged in.`
                    );

              localStorage.setItem('isLoggedIn', 'true');
              localStorage.setItem('userName', user.fullName);
              localStorage.setItem('userId', user.id);

              navigate('/home');
            }}
          />
        }
      />

      {/* EXPLORE NOTES */}

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
  path="/notifications"
  element={
    <>
      <Navbar title="NoteNest" />
      <Notifications />
    </>
  }
/>

      {/* UPLOAD NOTES */}

      <Route
        path="/upload"
        element={
          <>
            <Navbar title="NoteNest" />
            <UploadNotes onUpload={handleUpload} />
          </>
        }
      />

      {/* MY NOTES */}

      <Route
        path="/my-notes"
        element={
          <>
            <Navbar title="NoteNest" />

            <MyNotes
              notes={myNotes}
              onUpdate={updateNote}
              onDelete={deleteNote}
            />
          </>
        }
      />


            {/* BOOKMARKS */}

      <Route
        path="/bookmarks"
        element={
          <>
            <Navbar title="NoteNest" />
            <Bookmarks />
          </>
        }
      />

      {/* PROFILE */}

      <Route
        path="/profile"
        element={
          <>
            <Navbar title="NoteNest" />

            <Profile
              userName={userName}
              notes={myNotes}
            />
          </>
        }
      />

      {/* ABOUT */}

      <Route
        path="/about"
        element={
          <>
            <Navbar title="NoteNest" />
            <About />
          </>
        }
      />

      {/* DEFAULT ROUTE */}

      <Route
        path="/"
        element={
          <Navigate
            to={isLoggedIn ? '/home' : '/login'}
            replace
          />
        }
      />

      {/* HOME PAGE */}

      <Route
        path="/home"
        element={

          <div>

            <Navbar title="NoteNest" />

            <main className="home-content">

              {/* HERO SECTION */}

                    <section className="hero-section">

                    <div className="hero-text">

                        <span className="hero-tag">
                        ✨ WELCOME TO NOTENEST
                        </span>

                        <h1>
                        Your Learning Journey
                        <span> Starts Here.</span>
                        </h1>

                        <p>
                        Discover helpful study notes, share your knowledge
                        and connect with a community of learners.
                        Everything you need to learn better is here!
                        </p>

                        <div className="hero-buttons">

                        <button onClick={() => navigate('/explore')}>
                            Explore Notes →
                        </button>

                        <button
                            className="secondary-btn"
                            onClick={() => navigate('/upload')}
                        >
                            Upload Notes +
                        </button>

                        </div>

                        <div className="hero-welcome">
                        👋 Welcome {isLoggedIn ? userName : 'Learner'}!
                        </div>

                    </div>

                    <div className="hero-image">
                        <img src={heroImage} alt="Students learning" />
                    </div>

                    </section>

              {/* STATISTICS SECTION */}

              <section className="stats-grid">

                <div className="stat-card">

                  <div className="stat-icon">
                    ♡
                  </div>

                  <div>
                    <h2>{count}</h2>
                    <p>Total Likes</p>
                  </div>

                </div>

                <div className="stat-card">

                  <div className="stat-icon">
                    👤
                  </div>

                  <div>

                    <h3>
                      {isLoggedIn
                        ? `Welcome, ${userName}!`
                        : 'Join NoteNest'}
                    </h3>

                    <p>
                      {isLoggedIn
                        ? 'You are logged in'
                        : 'Start your learning journey'}
                    </p>

                  </div>

                </div>

                <div className="stat-card">

                  <div className="stat-icon">
                    📚
                  </div>

                  <div>
                    <h3>Study Resources</h3>
                    <p>Learn • Share • Grow</p>
                  </div>

                </div>

              </section>

              {/* UPLOAD SECTION */}

              <section className="add-note-section">

                <div className="form-heading">

                  <span>SHARE YOUR KNOWLEDGE</span>

                  <h2>Have Notes to Share?</h2>

                  <p>
                    Upload your study material and help other students learn.
                  </p>

                  <button onClick={() => navigate('/upload')}>
                    📤 Upload Your Notes →
                  </button>

                </div>

              </section>

              {/* HOW NOTENEST WORKS */}

                <section className="how-it-works">

                <div className="how-heading">
                    <span>START YOUR JOURNEY</span>
                    <h2>How NoteNest Works</h2>
                    <p>Three simple steps to make learning easier.</p>
                </div>

                <div className="steps-container">

                    <div className="step-card">
                    <div className="step-icon">📚</div>
                    <span className="step-number">01</span>
                    <h3>Explore Notes</h3>
                    <p>Discover useful study materials shared by other students.</p>
                    </div>

                    <div className="step-card">
                    <div className="step-icon">📤</div>
                    <span className="step-number">02</span>
                    <h3>Upload Notes</h3>
                    <p>Share your notes and help other learners grow.</p>
                    </div>

                    <div className="step-card">
                    <div className="step-icon">🎓</div>
                    <span className="step-number">03</span>
                    <h3>Learn Together</h3>
                    <p>Connect, learn and grow with the NoteNest community.</p>
                    </div>

                </div>

                </section>

              {/* AVAILABLE NOTES */}

              <section
                className="available-notes"
                id="notes"
              >

                <div className="notes-heading">

                  <span>EXPLORE RESOURCES</span>

                  <h2>Available Notes</h2>

                  <p>
                    Find study material and learn something new.
                  </p>

                </div>

                {/* SEARCH AND FILTER */}

                <div className="notes-filter">

                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <select
                    value={selectedSubject}
                    onChange={(e) =>
                      setSelectedSubject(e.target.value)
                    }
                  >

                    <option value="All">
                      All Subjects
                    </option>

                    <option value="Database Management">
                      Database Management
                    </option>

                    <option value="Design and Analysis">
                      Design and Analysis
                    </option>

                    <option value="Operating Systems">
                      Operating Systems
                    </option>

                    <option value="Programming">
                      Programming
                    </option>

                    <option value="Networking">
                      Networking
                    </option>

                  </select>

                </div>

                {/* NOTES CARDS */}

                <div className="notes-container">

                  {filteredNotes.length > 0 ? (

                    filteredNotes.map((note) => (

                      <div
                        className="note-card"
                        key={note.id}
                      >

                        <div className="note-icon">
                          📘
                        </div>

                        <h3>{note.title}</h3>

                        <span className="note-subject">
                          {note.subject}
                        </span>

                        <p>{note.description}</p>

                        <button
                          onClick={() => {
                            alert(
                              `Title: ${note.title}\nSubject: ${note.subject}\n\nDescription: ${note.description}`
                            );
                          }}
                        >
                          View Notes →
                        </button>

                        {isLoggedIn && isNoteOwner(note) && (

                          <button
                            onClick={() => navigate('/my-notes')}
                          >
                            Manage in My Notes
                          </button>

                        )}

                      </div>

                    ))

                  ) : (

                    <p className="no-notes">
                      No notes found. Try another search!
                    </p>

                  )}

                </div>

              </section>

              {/* LOGIN, LOGOUT AND LIKE BUTTONS */}

              <div className="bottom-buttons">

                <button
                  onClick={() => {

                    if (isLoggedIn) {
                      handleLogout();
                    } else {
                      navigate('/login');
                    }

                  }}
                >
                  {isLoggedIn ? 'Logout' : 'Login'}
                </button>

                <button
                  onClick={() => setCount(count + 1)}
                >
                  Like ♡
                </button>

              </div>

              {/* FOOTER */}

                <footer className="notenest-footer">

                <div className="footer-content">

                    <div className="footer-brand">
                    <h2>📚 NoteNest</h2>
                    <p>
                        Your learning space to explore, share
                        and grow together.
                    </p>
                    </div>

                    <div className="footer-links">
                    <h3>Quick Links</h3>
                    <a href="/">Home</a>
                    <a href="/explore">Explore Notes</a>
                    <a href="/upload">Upload Notes</a>
                    <a href="/about">About Us</a>
                    </div>

                    <div className="footer-contact">
                    <h3>Stay Connected</h3>
                    <p>Keep Learning • Keep Growing</p>
                    <p>Made with 💚 for Students</p>
                    </div>

                </div>

                <div className="footer-bottom">
                    © 2026 NoteNest. All Rights Reserved.
                </div>

                </footer>

            </main>

          </div>

        }
      />

    </Routes>
  );
}

export default App;