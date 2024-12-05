import React, { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore"; // Firestore imports
import { db } from "../firebaseConfig"; // Import Firestore instance
import ChannelsIcon from "../assets/ChannelsIcon.svg";
import NotificationsIcon from "../assets/Notifications.svg";
import NotificationsFilled from "../assets/NotificationsFilled.svg";
import CommentsIcon from "../assets/CommentIcon.svg"; // Import Comments icon
import Notifications from "./Notifications";
import Channels from "./Channels";
import Comments from "./Comments";

const TopMenu = ({ activeChannel, setActiveChannel }) => {
  const [unreadCount, setUnreadCount] = useState(0); // Track unread notifications
  const [showChannelsDropdown, setShowChannelsDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showCommentsDropdown, setShowCommentsDropdown] = useState(false); // New state for Comments
  const [activeChannelName, setActiveChannelName] = useState("Select Channel"); // Default placeholder

  // Fetch unread notifications count
  useEffect(() => {
    if (activeChannel) {
      const notificationsRef = collection(db, "notifications");
      const unreadQuery = query(
        notificationsRef,
        where("channelId", "==", activeChannel),
        where("watched", "==", false)
      );

      const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
        setUnreadCount(snapshot.size); // Update unread count in real time
        console.log(`Unread notifications for channel ${activeChannel}:`, snapshot.size);
      });

      return () => unsubscribe();
    }
  }, [activeChannel]);

  // Update the active channel's name whenever activeChannel changes
  useEffect(() => {
    const fetchChannelName = async () => {
      if (activeChannel) {
        try {
          const channelDoc = doc(db, "channels", activeChannel);
          const channelSnap = await getDoc(channelDoc);

          if (channelSnap.exists()) {
            const channelData = channelSnap.data();
            setActiveChannelName(channelData.name || "Unnamed Channel");
          } else {
            console.warn(`Channel with ID ${activeChannel} does not exist.`);
            setActiveChannelName("Unnamed Channel");
          }
        } catch (error) {
          console.error("Error fetching channel name:", error);
          setActiveChannelName("Error Loading Name");
        }
      } else {
        setActiveChannelName("Select Channel");
      }
    };

    fetchChannelName();
  }, [activeChannel]);

  const toggleChannelsDropdown = () => {
    setShowChannelsDropdown((prev) => !prev);
    setShowNotificationsDropdown(false);
    setShowCommentsDropdown(false); // Close Comments if open
  };

  const toggleNotificationsDropdown = () => {
    setShowNotificationsDropdown((prev) => !prev);
    setShowChannelsDropdown(false);
    setShowCommentsDropdown(false); // Close Comments if open
  };

  const toggleCommentsDropdown = () => {
    setShowCommentsDropdown((prev) => !prev);
    setShowChannelsDropdown(false);
    setShowNotificationsDropdown(false); // Close Notifications if open
  };

  return (
    <>
      {(showChannelsDropdown || showNotificationsDropdown || showCommentsDropdown) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            setShowChannelsDropdown(false);
            setShowNotificationsDropdown(false);
            setShowCommentsDropdown(false); // Close Comments
          }}
        ></div>
      )}

      <div className="fixed top-0 inset-x-0 bg-white shadow-md p-4 flex justify-between items-center z-50">
        <div className="flex items-center space-x-4">
          <span className="text-md font-medium text-gray-700">{activeChannelName}</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Channels Icon */}
          <button
            onClick={toggleChannelsDropdown}
            className="relative focus:outline-none"
          >
            <img src={ChannelsIcon} alt="Channels" className="h-6 w-6" />
          </button>

          {/* Notifications Icon */}
          <button
            onClick={toggleNotificationsDropdown}
            className="relative focus:outline-none"
          >
            <img
              src={unreadCount > 0 ? NotificationsFilled : NotificationsIcon}
              alt="Notifications"
              className="h-6 w-6"
            />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Comments Icon */}
          <button
            onClick={toggleCommentsDropdown}
            className="relative focus:outline-none"
          >
            <img src={CommentsIcon} alt="Comments" className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Channels Dropdown */}
      {showChannelsDropdown && (
        <Channels
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          onClose={() => setShowChannelsDropdown(false)}
        />
      )}

      {/* Notifications Dropdown */}
      {showNotificationsDropdown && (
        <Notifications
          onClose={() => setShowNotificationsDropdown(false)}
          channelId={activeChannel} // Pass activeChannel as channelId
        />
      )}

      {/* Comments Dropdown */}
      {showCommentsDropdown && (
        <Comments
          onClose={() => setShowCommentsDropdown(false)}
          channelId={activeChannel}
        />
      )}
    </>
  );
};

export default TopMenu;
