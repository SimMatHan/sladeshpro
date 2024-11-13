// src/pages/Notifications.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import './Notifications.css';

const Notifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Fetch notifications related to the user's channel
          // (We'll assume that all notifications for the user's channel are stored in a "notifications" collection)
          const notificationsRef = collection(db, "notifications");
          const notificationsQuery = query(
            notificationsRef,
            where("channelId", "==", "YOUR_CHANNEL_ID"), // Replace with user's actual channel ID
            orderBy("timestamp", "desc")
          );

          const snapshot = await getDocs(notificationsQuery);
          const notificationsData = snapshot.docs.map(doc => doc.data());
          setNotifications(notificationsData);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="notifications-overlay">
      <div className="notifications-container">
        <button className="close-button" onClick={onClose}>X</button>
        <h2>Notifications</h2>
        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                {notification.message}
              </div>
            ))
          ) : (
            <p>No recent notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
