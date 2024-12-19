import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Hub from "./pages/Hub";
import More from "./pages/More";
import Map from "./pages/Map";
import Score from "./pages/Score";
import ChannelSettings from "./pages/ChannelSettings";
import UserSettings from "./pages/UserSettings";
import Login from "./pages/Login";
import Notifications from "./components/Notifications";
import Comments from "./components/Comments";
import BottomMenu from "./components/BottomMenu";
import TopMenu from "./components/TopMenu";
import LoadingScreen from "./components/LoadingScreen";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, messaging } from "./firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from "firebase/firestore";
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const location = useLocation();

  const defaultChannelId = "DenAbneKanal";

  // Show initial loading screen only once
  useEffect(() => {
    const showInitialLoadingScreen = async () => {
      if (isInitialLoading) {
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 3000);
      }
    };

    showInitialLoadingScreen();
  }, [isInitialLoading]);

  // Fetch user onboarding status
  useEffect(() => {
    if (!user) return;

    const fetchOnboardingStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setHasCompletedOnboarding(userDoc?.data()?.hasCompletedOnboarding || false);
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
      }
    };

    fetchOnboardingStatus();
  }, [user]);

  // Fetch user's channels and set a default active channel
  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) return;

      try {
        const defaultChannelRef = doc(db, "channels", defaultChannelId);
        const defaultChannelSnap = await getDoc(defaultChannelRef);

        if (!defaultChannelSnap.exists()) {
          await setDoc(defaultChannelRef, {
            name: "Den Åbne Kanal",
            members: [],
            accessCode: "0000",
            createdAt: new Date().toISOString(),
          });
        }

        const channelsQuery = query(
          collection(db, "channels"),
          where("members", "array-contains", user.uid)
        );
        const snapshot = await getDocs(channelsQuery);
        const channels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        setChannelList(channels);
        setActiveChannel(channels.find((channel) => channel.id === defaultChannelId)?.id || channels[0]?.id);
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };

    fetchChannels();
  }, [user]);

  // Update user token for FCM
  useEffect(() => {
    const updateUserToken = async () => {
      if (!user) return;

      try {
        const token = await getToken(messaging, {
          vapidKey: "BB6-r3d9E_779-12K-jd8BdUjLD1BSubLa3peJG80AfQaXcCC4Nf8_vFPD8NbCTogqVPi9mDZlaygSPx1F4Sw1k",
        });

        if (token) {
          await setDoc(doc(db, "users", user.uid), { fcmToken: token }, { merge: true });
        } else {
          console.error("No FCM token received. Ensure notification permissions are granted.");
        }
      } catch (error) {
        console.error("Could not update FCM token:", error);
      }
    };

    updateUserToken();
  }, [user]);

  // Listen for FCM messages
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

  if (loading || isInitialLoading) {
    return <LoadingScreen />;
  }

  const toggleNotifications = () => setShowNotifications((prev) => !prev);
  const toggleComments = () => setShowComments((prev) => !prev);

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

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
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                user ? (
                  hasCompletedOnboarding ? (
                    <Navigate to="/home" />
                  ) : (
                    <Navigate to="/onboarding" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/home"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {user ? <Home activeChannel={activeChannel} /> : <Navigate to="/login" />}
                </motion.div>
              }
            />
            <Route
              path="/onboarding"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {user && !hasCompletedOnboarding ? (
                    <Onboarding onComplete={() => setHasCompletedOnboarding(true)} />
                  ) : (
                    <Navigate to="/home" />
                  )}
                </motion.div>
              }
            />
            <Route
              path="/hub"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {user ? <Hub activeChannel={activeChannel} /> : <Navigate to="/login" />}
                </motion.div>
              }
            />
            <Route
              path="/score"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {user ? <Score activeChannel={activeChannel} /> : <Navigate to="/login" />}
                </motion.div>
              }
            />
            <Route
              path="/map"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {user ? <Map activeChannel={activeChannel} /> : <Navigate to="/login" />}
                </motion.div>
              }
            />
            <Route
              path="/channel-settings"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {user ? <ChannelSettings activeChannel={activeChannel} /> : <Navigate to="/login" />}
                </motion.div>
              }
            />
            <Route
              path="/user-settings"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {user ? <UserSettings /> : <Navigate to="/login" />}
                </motion.div>
              }
            />
            <Route
              path="/more"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {user ? <More /> : <Navigate to="/login" />}
                </motion.div>
              }
            />
            <Route
              path="/login"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {!user ? (
                    <Login />
                  ) : (
                    <Navigate to={hasCompletedOnboarding ? "/home" : "/onboarding"} />
                  )}
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
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
