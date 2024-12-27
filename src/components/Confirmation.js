import React from "react";

const Confirmation = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-color)] rounded-lg p-6 w-80 shadow-heavy">
        <h2 className="text-lg font-semibold text-[var(--text-color)] mb-4">{title}</h2>
        <p className="text-[var(--text-muted)] mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[var(--bg-neutral)] text-[var(--text-muted)] rounded-lg hover:bg-[var(--highlight)] hover:text-[var(--text-color)] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[var(--secondary)] text-white rounded-lg shadow-md hover:bg-[var(--highlight)] transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
