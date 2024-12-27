// src/components/DesignProfilePicPopup.js
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

const emojiOptions = ["😊", "😎", "🐱", "🌈", "🎉", "💡", "🔥", "⚽", "🎸"];
const colorOptions = [
  { name: "Gradient 1", gradient: "linear-gradient(135deg, #d6f5d6, #f7e7b9)" },
  { name: "Gradient 2", gradient: "linear-gradient(135deg, #f7e7b9, #fff7d6)" },
  { name: "Gradient 3", gradient: "linear-gradient(135deg, #c1f0c1, #e8f3f5)" },
  { name: "Gradient 4", gradient: "linear-gradient(135deg, #d0eaff, #a3c6ff)" },
  { name: "Gradient 5", gradient: "linear-gradient(135deg, #fcd4b2, #b5f7d1)" },
];

const DesignProfilePicPopup = ({ onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(emojiOptions[0]);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].gradient);
  const user = auth.currentUser;

  const handleSave = async () => {
    if (!user) {
      console.error("No user logged in.");
      return;
    }

    const userDocRef = doc(db, "users", user.uid);

    try {
      await updateDoc(userDocRef, {
        profileImageUrl: selectedAvatar,
        profileBackgroundColor: selectedColor
      });
      onClose();
    } catch (err) {
      console.error("Error saving avatar: ", err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[var(--bg-color)] rounded-lg shadow-heavy w-11/12 md:w-3/4 p-6">
        <button
          className="text-[var(--text-muted)] float-right hover:text-[var(--error-color)] transition"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">
          Design Your Avatar
        </h2>
  
        <div
          className="profile-image w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-light"
          style={{ background: selectedColor }}
        >
          <span className="text-4xl font-bold">{selectedAvatar}</span>
        </div>
  
        <div className="mb-4">
          <h3 className="subheading text-[var(--text-muted)] mb-2">
            Select an Avatar
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {emojiOptions.map((emoji, index) => (
              <button
                key={index}
                className={`p-2 rounded transition ${
                  emoji === selectedAvatar
                    ? "bg-[var(--secondary)] text-[var(--text-color)]"
                    : "bg-[var(--bg-neutral)] text-[var(--text-muted)]"
                }`}
                onClick={() => setSelectedAvatar(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
  
        <div className="mb-6">
          <h3 className="subheading text-[var(--text-muted)] mb-2">
            Select Background Color
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.map((color, index) => (
              <button
                key={index}
                className="w-10 h-10 rounded-full border shadow-light hover:shadow-heavy transition"
                style={{ background: color.gradient }}
                onClick={() => setSelectedColor(color.gradient)}
              />
            ))}
          </div>
        </div>
  
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="button-primary flex-1 py-3"
          >
            Save Avatar
          </button>
          <button
            onClick={onClose}
            className="bg-[var(--bg-neutral)] text-[var(--text-muted)] py-3 px-4 rounded shadow-md hover:bg-[var(--divider-color)] flex-1 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignProfilePicPopup;
