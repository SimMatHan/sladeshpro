import React from "react";
import { useNavigate } from "react-router-dom";

const More = () => {
  const navigate = useNavigate();

  const handleNavigateToChannelSettings = () => {
    navigate("/channel-settings"); // Adjust the route as per your configuration
  };

  const handleNavigateToUserSettings = () => {
    navigate("/user-settings"); // Adjust the route as per your configuration
  };

  return (
    <div className="p-1 bg-[var(--bg-color)] min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-[var(--text-color)]">More</h1>
      <div className="space-y-2">
        <button
          onClick={handleNavigateToChannelSettings}
          className="w-full py-3 px-4 bg-[var(--secondary)] text-[var(--text-color)] border border-[var(--input-border)] rounded-lg flex justify-between items-center hover:bg-[var(--bg-neutral)] transition"
        >
          <span>Manage Channels</span>
          <span className="text-[var(--text-muted)]">›</span>
        </button>
        <button
          onClick={handleNavigateToUserSettings}
          className="w-full py-3 px-4 bg-[var(--secondary)] text-[var(--text-color)] border border-[var(--input-border)] rounded-lg flex justify-between items-center hover:bg-[var(--bg-neutral)] transition"
        >
          <span>User Settings</span>
          <span className="text-[var(--text-muted)]">›</span>
        </button>
        <button
          disabled
          className="w-full py-3 px-4 bg-[var(--disabled)] text-[var(--text-muted)] border border-[var(--disabled)] rounded-lg flex justify-between items-center cursor-not-allowed"
        >
          <span>Spin-the-wheel (Coming Soon)</span>
          <span className="text-[var(--disabled)]">›</span>
        </button>
        <button
          disabled
          className="w-full py-3 px-4 bg-[var(--disabled)] text-[var(--text-muted)] border border-[var(--disabled)] rounded-lg flex justify-between items-center cursor-not-allowed"
        >
          <span>Charts (Coming Soon)</span>
          <span className="text-[var(--disabled)]">›</span>
        </button>
      </div>
    </div>
  );  
};

export default More;
