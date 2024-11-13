import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

import DrinkFilled from '../assets/DrinkFilled.svg';
import Drink from '../assets/Drink.svg';
import LeaderboardFilled from '../assets/LeaderboardFilled.svg';
import Leaderboard from '../assets/Leaderboard.svg';
import SendFilled from '../assets/SendFilled.svg';
import Send from '../assets/Send.svg';
import ProfileIcon from '../assets/Profile.svg';

const BottomMenu = () => {
  const location = useLocation();
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileBackgroundColor, setProfileBackgroundColor] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileImageUrl(data.profileImageUrl || null);
          setProfileBackgroundColor(data.profileBackgroundColor || "linear-gradient(135deg, #f0f0f0, #f0f0f0)");
        }
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white shadow-lg flex justify-around py-2 z-50">
      <Link to="/home" className="flex flex-col items-center mb-2">
        <img src={location.pathname === '/home' ? DrinkFilled : Drink} alt="Home" className="h-6 w-6" />
        <span className="text-xs text-gray-600">Home</span>
      </Link>
      <Link to="/hub" className="flex flex-col items-center mb-2">
        <img src={location.pathname === '/hub' ? SendFilled : Send} alt="Hub" className="h-6 w-6" />
        <span className="text-xs text-gray-600">Sladesh</span>
      </Link>
      <Link to="/overview" className="flex flex-col items-center mb-2">
        <img src={location.pathname === '/overview' ? LeaderboardFilled : Leaderboard} alt="Overview" className="h-6 w-6" />
        <span className="text-xs text-gray-600">Overview</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center mb-2">
        {profileImageUrl ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: profileBackgroundColor }}
          >
            <span className="text-lg">{profileImageUrl}</span>
          </div>
        ) : (
          <img src={ProfileIcon} alt="Profile" className="h-6 w-6" />
        )}
        <span className="text-xs text-gray-600">Profile</span>
      </Link>
    </nav>
  );
};

export default BottomMenu;
