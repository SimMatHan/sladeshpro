import React from "react";

const DialogBox = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-color)] rounded-lg shadow-heavy p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold text-[var(--text-color)] mb-4">{title}</h2>
        <p className="text-[var(--text-muted)] mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 bg-[var(--secondary)] text-white rounded-lg shadow-md hover:bg-[var(--highlight)] transition"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default DialogBox;
