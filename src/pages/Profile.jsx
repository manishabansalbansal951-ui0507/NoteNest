function Profile({ userName, notes }) {
  return (
    <div className="profile-page">
      <div className="profile-card">

        <div className="profile-avatar">
          {userName ? userName.charAt(0).toUpperCase() : "U"}
        </div>

        <h1>{userName || "User"}</h1>
        <p>NoteNest Member</p>

        <div className="profile-stats">
          <div>
            <h2>{notes.length}</h2>
            <p>My Uploaded Notes</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;