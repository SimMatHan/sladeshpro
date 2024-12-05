import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Hub from "./pages/Hub";
import More from "./pages/More";
import Map from "./pages/Map";
import Score from "./pages/Score";
import ChannelSettings from "./pages/ChannelSettings"; // Added
import UserSettings from "./pages/UserSettings"; // Added
import Login from "./pages/Login";
import Notifications from "./components/Notifications";
import Comments from "./components/Comments";
import BottomMenu from "./components/BottomMenu";
import TopMenu from "./components/TopMenu";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, messaging } from "./firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from "firebase/firestore"; // Removed setDoc
import { getToken, onMessage } from "firebase/messaging";
import "./App.css";

function App() {
  const [user, loading] = useAuthState(auth);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [channelList, setChannelList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isChannelLoading, setIsChannelLoading] = useState(true); // To prevent rendering before favorite channel is set
  const location = useLocation();

  const defaultChannelId = "DenAbneKanal"; // Global constant

  const updateUserToken = async (currentUser) => {
    try {
      const token = await getToken(messaging, {
        vapidKey: "BB6-r3d9E_779-12K-jd8BdUjLD1BSubLa3peJG80AfQaXcCC4Nf8_vFPD8NbCTogqVPi9mDZlaygSPx1F4Sw1k",
      });
      if (token) {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, { fcmToken: token }, { merge: true });
      } else {
        console.error("No FCM token received. Ensure notification permissions are granted.");
      }
    } catch (error) {
      console.error("Could not update FCM token:", error);
    }
  };

  // Fetch user onboarding status
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setHasCompletedOnboarding(userDoc.data().hasCompletedOnboarding || false);
        }
      }
    };
    fetchOnboardingStatus();
  }, [user]);

  // Fetch user's channels and set a default active channel
  useEffect(() => {
    const fetchChannels = async () => {
      if (user) {
        setIsChannelLoading(true); // Start loading
        try {
          await createDefaultChannelIfNotExists(); // Ensure default channel exists
          await addUserToDefaultChannel(user); // Add user to default channel
  
          // Fetch user's channels
          const channelsRef = collection(db, "channels");
          const channelsQuery = query(
            channelsRef,
            where("members", "array-contains", user.uid)
          );
          const snapshot = await getDocs(channelsQuery);
          const channels = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setChannelList(channels);
  
          // Determine active channel
          const userDocRef = doc(db, "users", user.uid);
  
          const defaultChannel = channels.find((channel) => channel.id === defaultChannelId);
          setActiveChannel(defaultChannel?.id || channels[0]?.id);

        } catch (error) {
          console.error("Error fetching channels or setting default:", error);
        } finally {
          setIsChannelLoading(false); // Ensure loading stops
        }
      }
    };
  
    fetchChannels();
  }, [user]);
  
  useEffect(() => {
    if (user) {
      updateUserToken(user);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      const { notification } = payload;
      setNotifications((prev) => [
        ...prev,
        {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
        },
      ]);
    });
    return () => unsubscribeOnMessage();
  }, []);

  const addUserToDefaultChannel = async (user) => {
    try {
      const defaultChannelId = "DenAbneKanal"; // The ID of the default channel
      const defaultChannelRef = doc(db, "channels", defaultChannelId);
      const defaultChannelSnap = await getDoc(defaultChannelRef);
  
      if (defaultChannelSnap.exists()) {
        const defaultChannelData = defaultChannelSnap.data();
        if (!defaultChannelData.members?.includes(user.uid)) {
          // Add the user to the "members" array of the default channel
          await updateDoc(defaultChannelRef, {
            members: defaultChannelData.members
              ? [...defaultChannelData.members, user.uid]
              : [user.uid],
          });
          console.log(`User ${user.uid} added to "${defaultChannelId}".`);
        }
      } else {
        console.error(`Default channel "${defaultChannelId}" does not exist.`);
      }
    } catch (error) {
      console.error(`Error adding user to default channel "${defaultChannelId}":`, error);
    }
  };

  const createDefaultChannelIfNotExists = async () => {
    const defaultChannelId = "DenAbneKanal"; // The ID of the default channel
    try {
      const defaultChannelRef = doc(db, "channels", defaultChannelId);
      const defaultChannelSnap = await getDoc(defaultChannelRef);
  
      if (!defaultChannelSnap.exists()) {
        // Create the default channel
        await setDoc(defaultChannelRef, {
          name: "Den Åbne Kanal",
          members: [], // Initially, no members
          accessCode: "0000", // Example field
          createdAt: new Date().toISOString(),
        });
        console.log(`Default channel "${defaultChannelId}" created.`);
      }
    } catch (error) {
      console.error(`Error creating default channel "${defaultChannelId}":`, error);
    }
  };
  

  if (loading) {
    return <p className="text-center text-lg font-semibold">Loading...</p>;
  }

  const toggleNotifications = () => setShowNotifications((prev) => !prev);
  const toggleComments = () => setShowComments((prev) => !prev);

  return (
    <div className="app-container">
      {user && location.pathname !== "/onboarding" && (
        <TopMenu
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          channelList={channelList}
        />
      )}
      <div className="page-content">
        <Routes location={location}>
          <Route
            path="/"
            element={user ? <Navigate to="/home" /> : <Navigate to="/login" />}
          />
          <Route
            path="/home"
            element={user ? <Home activeChannel={activeChannel} /> : <Navigate to="/login" />}
          />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/hub"
            element={user ? <Hub activeChannel={activeChannel} /> : <Navigate to="/login" />}
          />
          <Route
            path="/score"
            element={user ? <Score activeChannel={activeChannel} /> : <Navigate to="/login" />}
          />
          <Route
            path="/map"
            element={user ? <Map activeChannel={activeChannel} /> : <Navigate to="/login" />}
          />
          <Route
            path="/channel-settings"
            element={user ? <ChannelSettings activeChannel={activeChannel} /> : <Navigate to="/login" />}
          />
          <Route
            path="/user-settings"
            element={user ? <UserSettings /> : <Navigate to="/login" />}
          />
          <Route
            path="/more"
            element={user ? <More /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={
              !user ? (
                <Login />
              ) : (
                <Navigate to={hasCompletedOnboarding ? "/home" : "/onboarding"} />
              )
            }
          />
        </Routes>
      </div>
      {user && location.pathname !== "/onboarding" && <BottomMenu />}
      {showNotifications && (
        <Notifications
          onClose={toggleNotifications}
          channelId={activeChannel}
        />
      )}
      {showComments && (
        <Comments onClose={toggleComments} channelId={activeChannel} />
      )}
    </div>
  );
  
}

export default App;
