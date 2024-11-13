// src/pages/GuidePopup.js
import React, { useState } from "react";

const GuidePopup = ({ onClose, onDoNotShowAgain }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState('Safari');

  const handleCheckboxChange = () => setDontShowAgain(!dontShowAgain);
  const handleClose = () => {
    if (dontShowAgain) {
      onDoNotShowAgain();
    }
    onClose();
  };

  const safariGuide = (
    <div>
      <h3 className="font-semibold mb-2">How to Add Website to Home Screen in Safari</h3>
      <ol className="list-decimal pl-5">
        <li>Open Safari on your iPhone.</li>
        <li>Visit the website.</li>
        <li>Tap the <strong>Share</strong> button.</li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
        <li>If missing, tap <strong>Edit Actions</strong> to add.</li>
      </ol>
    </div>
  );

  const chromeGuide = (
    <div>
      <h3 className="font-semibold mb-2">How to Add Website to Home Screen in Chrome</h3>
      <ol className="list-decimal pl-5">
        <li>Open Chrome on your phone.</li>
        <li>Visit the website.</li>
        <li>Tap the three dots in the top-right corner.</li>
        <li>Tap <strong>Add to Home screen</strong>.</li>
      </ol>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 p-6">
        <div className="flex justify-between mb-4">
          <button
            className={`${selectedBrowser === 'Safari' ? 'font-bold' : ''}`}
            onClick={() => setSelectedBrowser('Safari')}
          >
            Safari
          </button>
          <button
            className={`${selectedBrowser === 'Chrome' ? 'font-bold' : ''}`}
            onClick={() => setSelectedBrowser('Chrome')}
          >
            Chrome
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-2">Welcome to Club Send IT</h2>
        <p className="text-gray-600 mb-4">Add this website to your home screen for a more native app experience.</p>
        <div className="text-gray-700 mb-4">
          {selectedBrowser === 'Safari' ? safariGuide : chromeGuide}
        </div>

        <div className="flex items-center mb-4">
          <input type="checkbox" checked={dontShowAgain} onChange={handleCheckboxChange} />
          <label className="ml-2">Do not show again</label>
        </div>
        <button
          onClick={handleClose}
          className="bg-blue-600 text-white py-2 px-4 rounded shadow-md hover:bg-blue-700 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default GuidePopup;
