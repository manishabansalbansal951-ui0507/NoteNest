import { useState } from 'react';

function UploadNotes({ onUpload }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !subject || !description || !file) {
      alert("Please fill all fields and select a PDF!");
      return;
    }

    if (file.type !== 'application/pdf') {
      alert("Only PDF files are allowed!");
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      alert("Please login first!");
      return;
    }

    const formData = new FormData();

    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('description', description);
    formData.append('file', file);

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/upload-note`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Upload failed!");
        return;
      }

      alert("PDF uploaded successfully!");

      await onUpload(result.note);

      setTitle('');
      setSubject('');
      setDescription('');
      setFile(null);

      e.target.reset();

    } catch (error) {
      console.log("Upload Error:", error);
      alert("Upload failed! Please check your backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">

      <h1>Upload Your Notes</h1>

      <p>Share your study material with other students.</p>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Enter note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <textarea
          placeholder="Write note description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload PDF"}
        </button>

      </form>

    </div>
  );
}

export default UploadNotes;
