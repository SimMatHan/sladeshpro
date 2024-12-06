import React from "react";
import SureAboutThat from "../assets/SureAboutThat.gif"; // Import gif

const DialogBoxReset = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-sm text-center">
        {/* GIF Billede */}
        <img
          src={SureAboutThat}
          alt="Sure about that?"
          className="w-42 h-42 mb-4"
        />

        {/* Beskrivelse */}
        <p className="text-sm mb-6">
          Are you sure you want to reset all drinks? This action cannot be undone.
        </p>

        {/* Knapper */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-4 bg-[var(--delete-btn)] text-white rounded-lg hover:bg-[var(--delete-btn)]/90 transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogBoxReset;
