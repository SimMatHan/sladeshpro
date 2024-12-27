import React from "react";

const UncompletedSladeshModal = ({ sladesh, onComplete }) => {
  if (!sladesh) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
        <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">
          Complete Your Sladesh!
        </h2>
        <p className="text-[var(--text-muted)] mb-6">
          You received a Sladesh from{" "}
          <span className="font-bold text-[var(--highlight)]">
            {sladesh.fromName}
          </span>
          . Please complete it to continue using the app.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onComplete}
            className="py-2 px-4 bg-[var(--secondary)] text-white rounded-lg hover:bg-[var(--highlight)] transition"
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default UncompletedSladeshModal;
