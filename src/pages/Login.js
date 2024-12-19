import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false); // Tilføjet her

  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        setIsCheckingOnboarding(true); // Start loading
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const { hasCompletedOnboarding } = userDoc.data();
            if (hasCompletedOnboarding) {
              navigate("/home");
            } else {
              navigate("/onboarding");
            }
          } else {
            console.error("User document not found!");
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        } finally {
          setIsCheckingOnboarding(false); // Stop loading
        }
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
  
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Add the user to the Firestore "users" collection
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: username,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        isCheckedIn: false,
        drinks: {},
        totalDrinks: 0,
        lastLocation: null,
        hasCompletedOnboarding: false, // Default onboarding status
      });
  
      // Ensure the user is added to the default channel
      const defaultChannelRef = doc(db, "channels", "DenAbneKanal");
      const defaultChannelSnap = await getDoc(defaultChannelRef);
  
      if (!defaultChannelSnap.exists()) {
        // Create the default channel if it doesn't exist
        await setDoc(defaultChannelRef, {
          name: "Den Åbne Kanal",
          members: [user.uid],
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
  
      setMessage("Registration successful!");
      navigate("/onboarding"); // Redirect new users to onboarding
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration. Please try again.");
    }
  };
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if onboarding is completed
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const { hasCompletedOnboarding } = userDoc.data();
        if (hasCompletedOnboarding) {
          navigate("/home");
        } else {
          navigate("/onboarding");
        }
      } else {
        console.error("User document not found!");
        setError("Login failed. Please try again later.");
      }
    } catch (error) {
      console.error("Login error:", error);

      switch (error.code) {
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email. Please register first.");
          break;
        case "auth/invalid-email":
          setError("Invalid email format. Please enter a valid email.");
          break;
        default:
          setError("Login failed. Please try again later.");
      }
    }
  };

  if (isCheckingOnboarding) {
    // Show a loading spinner or message
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Checking your account...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6 shadow-light rounded-lg bg-[var(--bg-color)] text-center">
      <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Welcome to SladeshPro!</h1>
      <div className="text-[var(--text-muted)] mb-6">
        Track your hydration, reach your goals, and stay consistent with SladeshPro.
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-[var(--text-color)]">
        {isRegistering ? "Register" : "Login"}
      </h2>

      {message && <p className="text-[var(--highlight)] mb-4">{message}</p>}
      {error && <p className="text-[var(--error-color)] mb-4">{error}</p>}

      <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
        {isRegistering && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-3 border border-[var(--input-border)] rounded-md text-lg text-[var(--text-color)] focus:outline-none focus:ring focus:ring-[var(--primary)]"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-[var(--input-border)] rounded-md text-lg text-[var(--text-color)] focus:outline-none focus:ring focus:ring-[var(--primary)]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-[var(--input-border)] rounded-md text-lg text-[var(--text-color)] focus:outline-none focus:ring focus:ring-[var(--primary)]"
        />
        <button
          type="submit"
          className="w-full py-3 bg-[var(--primary)] text-[var(--secondary)] text-lg rounded-md hover:bg-[var(--highlight)] transition duration-300"
        >
          {isRegistering ? "Register" : "Login"}
        </button>
      </form>

      <p className="mt-4 text-[var(--text-muted)]">
        {isRegistering ? "Already have an account?" : "Don't have an account?"}
      </p>
      <p>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-[var(--primary)] font-semibold transition duration-200"
        >
          {isRegistering ? "Login" : "Register"}
        </button>
      </p>
    </div>
  );
};

export default Login;
