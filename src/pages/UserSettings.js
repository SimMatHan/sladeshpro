import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import DesignProfilePicPopup from "../components/DesignProfilePicPopup";

const UserSettings = () => {
  const [userData, setUserData] = useState({});
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileBackgroundColor, setProfileBackgroundColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDesignPopup, setShowDesignPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const user = auth.currentUser;

  const fetchUserData = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setProfileImageUrl(data.profileImageUrl || "");
        setProfileBackgroundColor(data.profileBackgroundColor || "");
        setIsDarkMode(data.isDarkMode || false); // Indlæs dark mode-status fra databasen
        document.documentElement.setAttribute(
          "data-theme",
          data.isDarkMode ? "dark" : "light"
        );
      }
    } catch (err) {
      console.error("Error fetching user data: ", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleOpenDesignPopup = () => setShowDesignPopup(true);

  const handleCloseDesignPopup = () => {
    setShowDesignPopup(false);
    fetchUserData(); // Refresh user data after closing the popup
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    setIsDarkMode(!isDarkMode);

    try {
      // Opdater dark mode-status i databasen
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        isDarkMode: !isDarkMode,
      });
    } catch (err) {
      console.error("Error updating dark mode preference: ", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  return (
    <div className="bg-[var(--bg-color)] text-[var(--text-color)] max-w-lg mx-auto rounded-lg">
      <div className="flex items-center space-x-4 mb-6">
        <div
          className="profile-image w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background:
              profileBackgroundColor || "linear-gradient(135deg, #f0f0f0, #f0f0f0)",
          }}
        >
          <span className="text-4xl font-bold">{profileImageUrl || "👤"}</span>
        </div>
        <button
          onClick={handleOpenDesignPopup}
          className="py-2 px-4 bg-[var(--highlight)] text-[var(--text-color)] rounded-md hover:bg-[var(--highlight-dark)] transition"
        >
          Change Photo
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[var(--text-color)] font-medium mb-1">Username</label>
          <input
            type="text"
            value={userData.username || ""}
            disabled
            className="w-full px-4 py-2 bg-[var(--bg-neutral)] border border-[var(--input-border)] rounded-lg text-[var(--text-color)] cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-[var(--text-color)] font-medium mb-1">Email</label>
          <input
            type="email"
            value={userData.email || ""}
            disabled
            className="w-full px-4 py-2 bg-[var(--bg-neutral)] border border-[var(--input-border)] rounded-lg text-[var(--text-color)] cursor-not-allowed"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="flex items-center space-x-3">
          <span className="text-[var(--text-color)] font-medium">Dark Mode</span>
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={toggleTheme}
            className="toggle-checkbox"
          />
        </label>
      </div>

      {showDesignPopup && <DesignProfilePicPopup onClose={handleCloseDesignPopup} />}
    </div>
  );
};

export default UserSettings;
