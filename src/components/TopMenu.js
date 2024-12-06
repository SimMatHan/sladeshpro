import React, { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ChannelsIcon from "../assets/ChannelsIcon.svg";
import ChannelsIconFilled from "../assets/ChannelsIconFilled.svg";
import NotificationsIcon from "../assets/Notifications.svg";
import NotificationsFilled from "../assets/NotificationsFilled.svg";
import CommentsIcon from "../assets/CommentIcon.svg";
import CommentsIconFilled from "../assets/CommentIconFilled.svg";
import Notifications from "./Notifications";
import Channels from "./Channels";
import Comments from "./Comments";

const TopMenu = ({ activeChannel, setActiveChannel }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChannelsDropdown, setShowChannelsDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showCommentsDropdown, setShowCommentsDropdown] = useState(false);
  const [activeChannelName, setActiveChannelName] = useState("Select Channel");

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
        setUnreadCount(snapshot.size);
      });

      return () => unsubscribe();
    }
  }, [activeChannel]);

  // Fetch active channel name
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
            setActiveChannelName("Unnamed Channel");
          }
        } catch {
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
    setShowCommentsDropdown(false);
  };

  const toggleNotificationsDropdown = () => {
    setShowNotificationsDropdown((prev) => !prev);
    setShowChannelsDropdown(false);
    setShowCommentsDropdown(false);
  };

  const toggleCommentsDropdown = () => {
    setShowCommentsDropdown((prev) => !prev);
    setShowChannelsDropdown(false);
    setShowNotificationsDropdown(false);
  };

  return (
    <>
      {/* Overlay for Dropdowns */}
      {(showChannelsDropdown || showNotificationsDropdown || showCommentsDropdown) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            setShowChannelsDropdown(false);
            setShowNotificationsDropdown(false);
            setShowCommentsDropdown(false);
          }}
        ></div>
      )}

      {/* Top Menu */}
      <div className="fixed top-0 inset-x-0 bg-[var(--bg-color)] shadow-heavy p-4 flex justify-between items-center z-50">
        {/* Channel Name */}
        <div className="flex items-center space-x-4">
          <span className="text-md font-semibold text-[var(--text-color)]">
            {activeChannelName}
          </span>
        </div>

        {/* Icons Section */}
        <div className="flex items-center space-x-4">
          {/* Channels Icon */}
          <button
            onClick={toggleChannelsDropdown}
            className="relative focus:outline-none hover:opacity-80 transition"
          >
            <img
              src={showChannelsDropdown ? ChannelsIconFilled : ChannelsIcon}
              alt="Channels"
              className="h-6 w-6"
            />
          </button>

          {/* Notifications Icon */}
          <button
            onClick={toggleNotificationsDropdown}
            className="relative focus:outline-none hover:opacity-80 transition"
          >
            <img
              src={showNotificationsDropdown ? NotificationsFilled : NotificationsIcon}
              alt="Notifications"
              className="h-6 w-6"
            />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-[var(--delete-btn)] text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-light">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Comments Icon */}
          <button
            onClick={toggleCommentsDropdown}
            className="relative focus:outline-none hover:opacity-80 transition"
          >
            <img
              src={showCommentsDropdown ? CommentsIconFilled : CommentsIcon}
              alt="Comments"
              className="h-6 w-6"
            />
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
          channelId={activeChannel}
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
