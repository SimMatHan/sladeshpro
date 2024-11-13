// src/components/TopMenu.js
import React, { useState } from 'react';
import NotificationsFilled from '../assets/NotificationsFilled.svg';
import Notifications from '../assets/Notifications.svg';

const TopMenu = ({ onToggleNotifications }) => {
  const [isNotificationActive, setIsNotificationActive] = useState(false);

  const handleNotificationClick = () => {
    setIsNotificationActive(!isNotificationActive);
    onToggleNotifications();
  };

  return (
    <div className="fixed top-0 inset-x-0 bg-white shadow-md p-4 flex justify-between items-center z-50">
      <h1 className="text-xl font-semibold text-blue-600">SladeshPro</h1>
      <button onClick={handleNotificationClick} className="focus:outline-none">
        <img
          src={isNotificationActive ? NotificationsFilled : Notifications}
          alt="Notifications"
          className="h-6 w-6"
        />
      </button>
    </div>
  );
};

export default TopMenu;
