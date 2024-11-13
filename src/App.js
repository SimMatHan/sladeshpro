// src/App.js
import React, { useEffect, useState } from 'react';
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Hub from "./pages/Hub";
import Charts from "./pages/Charts";
import Profile from "./pages/Profile";
import Overview from "./pages/Overview";  // Import Overview
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import BottomMenu from "./components/BottomMenu";
import TopMenu from "./components/TopMenu";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import './App.css';

function App() {
  const [user, loading] = useAuthState(auth);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // New state for notifications
  const location = useLocation();

  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setHasCompletedOnboarding(userData.hasCompletedOnboarding || false);
        }
      }
    };

    fetchOnboardingStatus();
  }, [user]);

  if (loading) {
    return <p>Loading...</p>;
  }

  const toggleNotifications = () => setShowNotifications(prev => !prev); // Toggle notifications visibility

  return (
    <div className="app-container">
      {user && <TopMenu onToggleNotifications={toggleNotifications} />}
      <div className="page-content">
        <Routes location={location}>
          <Route path="/" element={user ? <Navigate to="/home" /> : <Navigate to="/login" />} />
          <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/hub" element={user ? <Hub /> : <Navigate to="/login" />} />
          <Route path="/charts" element={user ? <Charts /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} /> {/* Add Profile route */}
          <Route path="/overview" element={user ? <Overview /> : <Navigate to="/login" />} /> {/* Add Overview route */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to={hasCompletedOnboarding ? "/home" : "/onboarding"} />} />
        </Routes>
      </div>
      {user && <BottomMenu />}
      {showNotifications && <Notifications onClose={toggleNotifications} />} {/* Overlay component */}
    </div>
  );
}

export default App;
