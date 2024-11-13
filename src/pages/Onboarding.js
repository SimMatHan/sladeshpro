// src/pages/Onboarding.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import './Onboarding.css';

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
      // Set user as having completed onboarding
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { hasCompletedOnboarding: true });
      }
      navigate("/home");
    }
  };

  return (
    <div className="onboarding-container">
      <h1>{slides[currentSlide].title}</h1>
      <p>{slides[currentSlide].content}</p>
      <button onClick={handleNext}>
        {currentSlide < slides.length - 1 ? "Next" : "Let's Go"}
      </button>
    </div>
  );
};

export default Onboarding;
