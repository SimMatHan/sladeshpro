import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const Notifications = ({ onClose, channelId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (channelId) {
      const notificationsRef = collection(db, "notifications");
      const notificationsQuery = query(
        notificationsRef,
        where("channelId", "==", channelId),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(fetchedNotifications);

        // Mark notifications as watched
        fetchedNotifications.forEach(async (notification) => {
          if (!notification.watched) {
            const notificationRef = doc(db, "notifications", notification.id);
            await updateDoc(notificationRef, { watched: true });
          }
        });
      });

      return () => unsubscribe();
    }
  }, [channelId]);

  const handleClearAll = async () => {
    try {
      const deletePromises = notifications.map((notification) =>
        deleteDoc(doc(db, "notifications", notification.id))
      );

      await Promise.all(deletePromises);

      // Clear local state after successful deletion
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return (
    <div className="fixed top-[50px] inset-0 flex justify-center items-start z-50">
      <div
        className="fixed top-[60px] inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-[var(--bg-color)] rounded-b-lg shadow-lg w-full md:w-3/4 lg:w-1/2 max-h-[80vh] p-4 mt-0 overflow-hidden transform translate-y-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-color)]">Notifications</h2>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="py-1 px-3 bg-[var(--delete-btn)] text-white text-sm rounded shadow-md hover:bg-[var(--delete-btn)]/90"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 bg-[var(--bg-neutral)] rounded-lg shadow-md"
              >
                <p className="text-[var(--text-color)]">{notification.message}</p>
                <span className="text-[var(--text-muted)] text-sm">
                  {new Date(notification.timestamp?.seconds * 1000).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-[var(--text-muted)]">No recent notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
