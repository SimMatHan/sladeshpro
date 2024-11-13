// src/components/TopMenu.js
import React from 'react';
import './TopMenu.css';

const TopMenu = ({ onToggleNotifications }) => {
  return (
    <div className="top-menu">
      <h1>SladeshPro</h1>
      <button onClick={onToggleNotifications} className="notifications-button">
        🔔 Notifications
      </button>
    </div>
  );
};

export default TopMenu;
