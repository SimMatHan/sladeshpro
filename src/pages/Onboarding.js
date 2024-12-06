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
  {
    title: "Add to Home Screen",
    content: (selectedBrowser, setSelectedBrowser) => (
      <>
        <p className="text-[var(--text-muted)] mb-4">
          Add this website to your home screen for a more native app experience.
        </p>
        {/* Tabs Container */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            className={`py-2 px-4 rounded-full ${selectedBrowser === "Safari"
                ? "bg-[var(--primary)] text-[var(--secondary)] font-semibold"
                : "bg-[var(--bg-neutral)] text-[var(--text-muted)]"
              }`}
            onClick={() => setSelectedBrowser("Safari")}
          >
            Safari
          </button>
          <button
            className={`py-2 px-4 rounded-full ${selectedBrowser === "Chrome"
                ? "bg-[var(--primary)] text-[var(--secondary)] font-semibold"
                : "bg-[var(--bg-neutral)] text-[var(--text-muted)]"
              }`}
            onClick={() => setSelectedBrowser("Chrome")}
          >
            Chrome
          </button>
        </div>
        {selectedBrowser === "Safari" ? (
          <div>
            <h3 className="font-semibold text-[var(--text-color)] mb-2">
              How to Add Website to Home Screen in Safari
            </h3>
            <ol className="list-decimal pl-5 text-left text-[var(--text-color)]">
              <li>Open Safari on your iPhone.</li>
              <li>Visit the website.</li>
              <li>Tap the <strong>Share</strong> button.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>If missing, tap <strong>Edit Actions</strong> to add.</li>
            </ol>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-[var(--text-color)] mb-2">
              How to Add Website to Home Screen in Chrome
            </h3>
            <ol className="list-decimal pl-5 text-left text-[var(--text-color)]">
              <li>Open Chrome on your phone.</li>
              <li>Visit the website.</li>
              <li>Tap the three dots in the top-right corner.</li>
              <li>Tap <strong>Add to Home screen</strong>.</li>
            </ol>
          </div>
        )}
      </>
    ),
  },
];


const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedBrowser, setSelectedBrowser] = useState('Safari');
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

  const currentContent =
    typeof slides[currentSlide].content === "function"
      ? slides[currentSlide].content(selectedBrowser, setSelectedBrowser)
      : slides[currentSlide].content;

  return (
    <div className="flex flex-col items-center justify-center h-[calc(-150px+100vh)] p-6 text-center bg-[var(--bg-color)]">
      <h1 className="text-3xl font-bold text-[var(--primary)] mb-4">
        {slides[currentSlide].title}
      </h1>
      <div className="text-lg text-[var(--text-muted)] mb-8">
        {currentContent}
      </div>
      <button
        onClick={handleNext}
        className="px-6 py-3 bg-[var(--primary)] text-[var(--secondary)] text-lg rounded-full shadow-light hover:bg-[var(--highlight)] transition duration-300"
      >
        {currentSlide < slides.length - 1 ? "Next" : "Let's Go"}
      </button>
    </div>
  );
};

export default Onboarding;
