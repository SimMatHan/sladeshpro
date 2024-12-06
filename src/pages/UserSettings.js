import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import DesignProfilePicPopup from "../components/DesignProfilePicPopup";

const UserSettings = () => {
  const [userData, setUserData] = useState({});
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileBackgroundColor, setProfileBackgroundColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDesignPopup, setShowDesignPopup] = useState(false);

  const user = auth.currentUser;

  const fetchUserData = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setProfileImageUrl(data.profileImageUrl || "");
        setProfileBackgroundColor(data.profileBackgroundColor || "");
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

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  return (
    <div className="p-4 bg-[var(--bg-color)] text-[var(--text-color)]">
      <h2 className="text-xl font-semibold text-center mb-6">
        User Settings
      </h2>
      <div className="space-y-4 text-center">
        <div
          className="profile-image w-40 h-40 rounded-full mx-auto flex items-center justify-center shadow-lg"
          style={{
            background: profileBackgroundColor || "linear-gradient(135deg, #f0f0f0, #f0f0f0)",
          }}
        >
          <span className="text-6xl font-bold">
            {profileImageUrl || "👤"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleOpenDesignPopup}
          className="button-primary w-full py-4 text-[var(--text-color)] text-lg font-semibold"
        >
          Design Profile Pic
        </button>
      </div>

      {showDesignPopup && <DesignProfilePicPopup onClose={handleCloseDesignPopup} />}
    </div>
  );
};


export default UserSettings;
