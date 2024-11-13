// src/pages/Onboarding.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const slides = [
  {
    title: "Welcome to SladeshPro!",
    content: "Track your hydration and stay on top of your goals.",
  },
  {
    title: "Connect with Friends",
    content: "Check-in and compete with your friends in the same channel.",
  },
  {
    title: "Send Sladesh!",
    content: "Send Sladesh to your friends when they are checked in.",
  },
  {
    title: "Track Your Drinks",
    content: "Keep track of each drink you take and see your total count.",
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = async () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { hasCompletedOnboarding: true });
      }
      navigate("/home");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-white">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        {slides[currentSlide].title}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {slides[currentSlide].content}
      </p>
      <button
        onClick={handleNext}
        className="px-6 py-3 bg-blue-600 text-white text-lg rounded-full shadow-md hover:bg-blue-700 transition duration-300"
      >
        {currentSlide < slides.length - 1 ? "Next" : "Let's Go"}
      </button>
    </div>
  );
};

export default Onboarding;
