// src/pages/Notifications.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const Notifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const notificationsRef = collection(db, "notifications");
          const notificationsQuery = query(
            notificationsRef,
            where("channelId", "==", "YOUR_CHANNEL_ID"), // Replace with the actual channel ID
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
    <div className="fixed top-[60px] inset-0 flex justify-center items-start z-50">
      {/* Overlay for background dimming */}
      <div className="fixed top-[60px] inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Notifications container */}
      <div className="bg-white rounded-b-lg shadow-lg w-full md:w-3/4 lg:w-1/2 max-h-1/2 p-4 mt-0 overflow-y-auto transform translate-y-0">
        
        <div className="mt-4 space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={index} className="p-3 bg-gray-100 rounded-lg shadow-md">
                {notification.message}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No recent notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
