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
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 p-6">
        <button className="text-gray-500 float-right" onClick={onClose}>✕</button>
        <h2 className="text-xl font-semibold mb-4">Design Your Avatar</h2>
        
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
          style={{ background: selectedColor }}
        >
          <span className="text-4xl">{selectedAvatar}</span>
        </div>

        <div className="mb-4">
          <h3 className="text-gray-600 mb-2">Select an Avatar</h3>
          <div className="grid grid-cols-5 gap-2">
            {emojiOptions.map((emoji, index) => (
              <button
                key={index}
                className={`p-2 rounded ${emoji === selectedAvatar ? 'bg-blue-200' : 'bg-gray-100'}`}
                onClick={() => setSelectedAvatar(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-gray-600 mb-2">Select Background Color</h3>
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.map((color, index) => (
              <button
                key={index}
                className="w-10 h-10 rounded-full border"
                style={{ background: color.gradient }}
                onClick={() => setSelectedColor(color.gradient)}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white py-2 px-4 rounded shadow-md hover:bg-green-700 flex-1"
          >
            Save Avatar
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded shadow-md hover:bg-gray-400 flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignProfilePicPopup;
