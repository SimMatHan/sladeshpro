// src/components/BottomMenu.js
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import './BottomMenu.css';

import DrinkFilled from '../assets/DrinkFilled.svg';
import Drink from '../assets/Drink.svg';
import LeaderboardFilled from '../assets/LeaderboardFilled.svg';
import Leaderboard from '../assets/Leaderboard.svg';
import SendFilled from '../assets/SendFilled.svg';
import Send from '../assets/Send.svg';
import ProfileIcon from '../assets/Profile.svg'; // Standardikon

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
          setProfileImageUrl(data.profileImageUrl || null); // Hvis intet billede, sætter vi null
          setProfileBackgroundColor(data.profileBackgroundColor || "linear-gradient(135deg, #f0f0f0, #f0f0f0)");
        }
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <nav className="bottom-menu">
      <ul>
        <li className={location.pathname === '/home' ? 'active' : ''}>
          <Link to="/home">
            <img 
              src={location.pathname === '/home' ? DrinkFilled : Drink} 
              alt="Home" 
              className="nav-icon"
            />
            <span>Home</span>
          </Link>
        </li>
        <li className={location.pathname === '/hub' ? 'active' : ''}>
          <Link to="/hub">
            <img 
              src={location.pathname === '/hub' ? SendFilled : Send} 
              alt="Hub" 
              className="nav-icon"
            />
            <span>Sladesh</span>
          </Link>
        </li>
        <li className={location.pathname === '/overview' ? 'active' : ''}>
          <Link to="/overview">
            <img 
              src={location.pathname === '/overview' ? LeaderboardFilled : Leaderboard} 
              alt="Overview" 
              className="nav-icon"
            />
            <span>Overview</span>
          </Link>
        </li>
        <li className={location.pathname === '/profile' ? 'active' : ''}> {/* Profil-knappen med brugerdefineret billede eller standardikon */}
          <Link to="/profile">
            {profileImageUrl ? (
              <div
                className="profile-icon"
                style={{
                  background: profileBackgroundColor,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  fontSize: '24px',
                  overflow: 'hidden'
                }}
              >
                <span className="avatar-emoji">{profileImageUrl}</span>
              </div>
            ) : (
              <img 
                src={ProfileIcon} 
                alt="Profile" 
                className="nav-icon"
              />
            )}
            <span>Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default BottomMenu;
