import React, { useEffect, useState, useCallback  } from "react";
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
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from "firebase/firestore";
import UncompletedSladeshModal from "./components/UncompletedSladeshModal"; // Ny komponent til popup
import "./App.css";

function App() {
  const [user, loading] = useAuthState(auth);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [channelList, setChannelList] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [uncompletedSladesh, setUncompletedSladesh] = useState(null); // Tilføjet til popup-logik
  const location = useLocation();

  const defaultChannelId = "DenAbneKanal";

  const fetchUncompletedSladesh = useCallback(async () => {
    if (!user) return;

    try {
      const receivedRef = collection(db, `users/${user.uid}/sladesh`);
      const receivedSnapshot = await getDocs(receivedRef);

      const uncompleted = receivedSnapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .find((sladesh) => !sladesh.completed);

      setUncompletedSladesh(uncompleted || null);
    } catch (error) {
      console.error("Error fetching uncompleted Sladesh:", error);
    }
  }, [user]);

  useEffect(() => {
  fetchUncompletedSladesh(); // Sørg for at kalde funktionen her
}, [fetchUncompletedSladesh]);

  const handleCompleteSladesh = async () => {
    if (!uncompletedSladesh) return;

    try {
      const sladeshRef = doc(
        db,
        `users/${user.uid}/sladesh/${uncompletedSladesh.id}`
      );
      const senderSladeshRef = doc(
        db,
        `users/${uncompletedSladesh.fromUID}/sladeshSent/${uncompletedSladesh.id}`
      );

      await updateDoc(sladeshRef, { completed: true });
      await updateDoc(senderSladeshRef, { completed: true });

      setUncompletedSladesh(null); // Fjern popup efter completion
    } catch (error) {
      console.error("Error completing Sladesh:", error);
    }
  };

  // Show initial loading screen only once
  useEffect(() => {
    const showInitialLoadingScreen = () => {
      if (isInitialLoading) {
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 3000);
      }
    };

    showInitialLoadingScreen();
  }, [isInitialLoading]);


  // Fetch onboarding status
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          setHasCompletedOnboarding(userDoc?.data()?.hasCompletedOnboarding || false);
        } catch (error) {
          console.error("Error fetching onboarding status:", error);
        } finally {
          setIsInitialLoading(false); // Stop loading
        }
      }
    };

    fetchOnboardingStatus();
  }, [user]);

  // Fetch user's channels and set a default active channel
  // Fetch user's channels and set a default active channel
  useEffect(() => {
    const fetchChannels = async () => {
      if (user) {
        try {
          const defaultChannelRef = doc(db, "channels", defaultChannelId);
          const defaultChannelSnap = await getDoc(defaultChannelRef);

          if (!defaultChannelSnap.exists()) {
            // Create the default channel if it doesn't exist
            await setDoc(defaultChannelRef, {
              name: "Den Åbne Kanal",
              members: [user.uid], // Add the current user as the first member
              accessCode: "0000",
              createdAt: new Date().toISOString(),
            });
          } else {
            // Add the user to the default channel if not already a member
            const channelData = defaultChannelSnap.data();
            if (!channelData.members.includes(user.uid)) {
              await updateDoc(defaultChannelRef, {
                members: [...channelData.members, user.uid],
              });
            }
          }

          const channelsQuery = query(
            collection(db, "channels"),
            where("members", "array-contains", user.uid)
          );
          const snapshot = await getDocs(channelsQuery);
          const channels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setChannelList(channels);
          setActiveChannel(defaultChannelId); // Always set the default channel as the active one
        } catch (error) {
          console.error("Error fetching or creating channels:", error);
        }
      }
    };

    fetchChannels();
  }, [user]);



  if (loading || isInitialLoading) {
    return <LoadingScreen user={user} hasCompletedOnboarding={hasCompletedOnboarding} />;
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
      {uncompletedSladesh && (
        <UncompletedSladeshModal
          sladesh={uncompletedSladesh}
          onComplete={handleCompleteSladesh}
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
