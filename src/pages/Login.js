// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
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

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: username,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        showGuide: true
      });

      setMessage("Registration successful!");
      navigate("/home");
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
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
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

  return (
    <div className="max-w-sm mx-auto p-6 shadow-lg rounded-lg bg-white text-center">
      <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome to SladeshPro!</h1>
      <div className="text-gray-500 mb-6">
        Track your hydration, reach your goals, and stay consistent with SladeshPro.
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">{isRegistering ? "Register" : "Login"}</h2>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
        {isRegistering && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring focus:ring-blue-200"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring focus:ring-blue-200"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring focus:ring-blue-200"
        />
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white text-lg rounded-md hover:bg-blue-700 transition duration-300"
        >
          {isRegistering ? "Register" : "Login"}
        </button>
      </form>

      <p className="mt-4 text-gray-600">
        {isRegistering ? "Already have an account?" : "Don't have an account?"}
      </p>
      <p>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-500 font-semibold hover:text-blue-600 transition duration-200"
        >
          {isRegistering ? "Login" : "Register"}
        </button>
      </p>
    </div>
  );
};

export default Login;
