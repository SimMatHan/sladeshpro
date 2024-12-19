import React from "react";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Lottie animationData={loadingAnimation} loop={true} />
    </div>
  );
};

export default LoadingScreen;
