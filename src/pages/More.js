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
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-6">More</h1>
      <div className="space-y-6">
        <button
          onClick={handleNavigateToChannelSettings}
          className="w-full py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold"
        >
          Manage Channels
        </button>
        <button
          onClick={handleNavigateToUserSettings}
          className="w-full py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold"
        >
          User Settings
        </button>
      </div>
    </div>
  );
};

export default More;
