import { useState, useEffect } from 'react';
import './Notifications.css';

function Notifications() {

  const [notifications, setNotifications] = useState([]);

  // LOAD NOTIFICATIONS
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem('notifications') || '[]'
    );

    setNotifications(saved);
  }, []);

  // MARK SINGLE NOTIFICATION AS READ
  const markAsRead = (id) => {
    const updated = notifications.map(item =>
      item.id === id ? { ...item, read: true } : item
    );

    setNotifications(updated);

    localStorage.setItem(
      'notifications',
      JSON.stringify(updated)
    );
  };

  // MARK ALL AS READ
  const markAllAsRead = () => {
    const updated = notifications.map(item => ({
      ...item,
      read: true
    }));

    setNotifications(updated);

    localStorage.setItem(
      'notifications',
      JSON.stringify(updated)
    );
  };

  // DELETE SINGLE NOTIFICATION
  const deleteNotification = (id) => {
    const updated = notifications.filter(
      item => item.id !== id
    );

    setNotifications(updated);

    localStorage.setItem(
      'notifications',
      JSON.stringify(updated)
    );
  };

  // CLEAR ALL NOTIFICATIONS
  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  // UNREAD COUNT
  const unreadCount = notifications.filter(
    item => !item.read
  ).length;

  return (
    <div className="notifications-page">

      {/* HEADER */}
      <div className="notification-header">

        <div>
          <h1>Notifications 🔔</h1>
          <p>Stay updated with your NoteNest activities.</p>
        </div>

        {notifications.length > 0 && (
          <div className="notification-actions">

            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>
                Mark All as Read
              </button>
            )}

            <button onClick={clearAll}>
              Clear All
            </button>

          </div>
        )}

      </div>

      {/* SUMMARY */}
      <div className="notification-summary">
        <h2>{notifications.length}</h2>
        <p>Total Notifications</p>
        <span>{unreadCount} Unread</span>
      </div>

      {/* NOTIFICATION LIST */}
      <div className="notification-list">

        {notifications.length === 0 ? (

          <div className="notification-empty">
            <div>🔕</div>
            <h2>No Notifications Yet!</h2>
            <p>
              You're all caught up.
              New updates will appear here.
            </p>
          </div>

        ) : (

          notifications.map(item => (

            <div
              className={`notification-card ${
                item.read ? 'read' : 'unread'
              }`}
              key={item.id}
            >

              <div className="notification-icon">
                🔔
              </div>

              <div className="notification-content">

                <h3>{item.title}</h3>

                <p>{item.message}</p>

                <small>{item.date}</small>

              </div>

              {/* ACTION BUTTONS */}
              <div className="notification-buttons">

                {!item.read && (
                  <button
                    onClick={() => markAsRead(item.id)}
                  >
                    Mark Read
                  </button>
                )}

                <button
                  className="delete-notification"
                  onClick={() => deleteNotification(item.id)}
                >
                  Delete
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default Notifications;