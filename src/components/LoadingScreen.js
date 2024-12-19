import React, { useEffect } from "react";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import { Navigate } from "react-router-dom";

const LoadingScreen = ({ user, hasCompletedOnboarding }) => {
  useEffect(() => {
    // Simulerer loading med en kort pause (valgfrit)
    const timeout = setTimeout(() => {}, 1000);
    return () => clearTimeout(timeout);
  }, []);

  if (user) {
    return hasCompletedOnboarding ? <Navigate to="/home" /> : <Navigate to="/onboarding" />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Lottie animationData={loadingAnimation} loop={true} />
    </div>
  );
};

export default LoadingScreen;
