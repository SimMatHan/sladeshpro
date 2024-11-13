import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";  // Firestore update methods
import { db, auth } from "../firebaseConfig";  // Firebase config
import "./DesignProfilePicPopup.css";

// Updated emoji and color options
const emojiOptions = [
    "😊", "😎", "🐱", "🌈", "🎉", "💡", "🔥", "⚽", "🎸"
  ];

  const colorOptions = [
    { name: "Gradient 1", gradient: "linear-gradient(135deg, #d6f5d6, #f7e7b9)" },
    { name: "Gradient 2", gradient: "linear-gradient(135deg, #f7e7b9, #fff7d6)" },
    { name: "Gradient 3", gradient: "linear-gradient(135deg, #c1f0c1, #e8f3f5)" },
    { name: "Gradient 4", gradient: "linear-gradient(135deg, #d0eaff, #a3c6ff)" },
    { name: "Gradient 5", gradient: "linear-gradient(135deg, #fcd4b2, #b5f7d1)" }
  ];

const DesignProfilePicPopup = ({ onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(emojiOptions[0]); // Default avatar
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].gradient); // Default gradient background color

  const user = auth.currentUser; // Get the currently logged-in user

  // Function to handle saving the avatar and background color to Firebase
  const handleSave = async () => {
    if (!user) {
      console.error("No user logged in.");
      return;
    }

    const userDocRef = doc(db, "users", user.uid);

    try {
      // Save the selected avatar and background color to the user's Firestore document
      await updateDoc(userDocRef, {
        profileImageUrl: selectedAvatar,
        profileBackgroundColor: selectedColor
      });
      console.log("Avatar and background saved successfully!");
      onClose(); // Close the popup after saving
    } catch (err) {
      console.error("Error saving avatar: ", err);
    }
  };

  return (
    <div>
      {/* Overlay */}
      <div className="design-profile-overlay" onClick={onClose}></div>

      {/* Design Avatar Panel */}
      <div className="design-profile-pic-panel slide-up">
        <button className="close-button" onClick={onClose}>
          X
        </button>

        {/* Avatar Design Section */}
        <div className="design-avatar-content">
          <h2>Design Your Avatar</h2>

          {/* Preview Area */}
          <div
            className="avatar-preview"
            style={{ background: selectedColor }}
          >
            <span className="avatar-emoji">{selectedAvatar}</span>
          </div>

          {/* Avatar Selection */}
          <div className="avatar-options">
            <h3>Select an Avatar</h3>
            <div className="emoji-grid">
              {emojiOptions.map((emoji, index) => (
                <button
                  key={index}
                  className={`emoji-btn ${emoji === selectedAvatar ? "selected" : ""}`}
                  onClick={() => setSelectedAvatar(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color Selection */}
          <div className="color-options">
            <h3>Select Background Color</h3>
            <div className="color-grid">
              {colorOptions.map((color, index) => (
                <button
                  key={index}
                  className={`color-btn ${color.gradient === selectedColor ? "selected" : ""}`}
                  style={{ background: color.gradient }}
                  onClick={() => setSelectedColor(color.gradient)}
                />
              ))}
            </div>
          </div>

          {/* Save and Cancel buttons */}
          <div className="design-buttons">
            <button className="save-avatar-button" onClick={handleSave}>
              Save Avatar
            </button>
            <button className="cancel-avatar-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignProfilePicPopup;
