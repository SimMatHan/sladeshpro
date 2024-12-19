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
    <div className="p-4 bg-[var(--bg-color)] min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-[var(--text-color)]">
        More
      </h1>
      <div className="space-y-6">
        <button
          onClick={handleNavigateToChannelSettings}
          className="w-full py-4 bg-[var(--primary)] text-[var(--secondary)] rounded-lg font-semibold hover:bg-[var(--highlight)] transition"
        >
          Manage Channels
        </button>
        <button
          onClick={handleNavigateToUserSettings}
          className="w-full py-4 bg-[var(--primary)] text-[var(--secondary)] rounded-lg font-semibold hover:bg-[var(--highlight)] transition"
        >
          User Settings
        </button>
        <button
          disabled
          className="w-full py-4 bg-[var(--disabled)] text-[var(--text-muted)] rounded-lg font-semibold cursor-not-allowed"
        >
          Spin-the-wheel (Comming Soon)
        </button>
        <button
          disabled
          className="w-full py-4 bg-[var(--disabled)] text-[var(--text-muted)] rounded-lg font-semibold cursor-not-allowed"
        >
          Charts (Coming Soon)
        </button>
        <button
          disabled
          className="w-full py-4 bg-[var(--disabled)] text-[var(--text-muted)] rounded-lg font-semibold cursor-not-allowed"
        >
          DarkMode (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default More;
