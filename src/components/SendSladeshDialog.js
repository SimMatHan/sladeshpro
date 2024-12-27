import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";

const SendSladeshDialog = ({ onClose, onSladeshSent, message }) => {
  const [tiltDetected, setTiltDetected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Gyroscope handler
  const handleGyroscope = (event) => {
    const beta = event.beta !== null ? event.beta : 0; // Registrer hældning
    console.log("Gyroscope event:", event.beta);
    if (beta < -15) {
      console.log("Tilt detected! Sladesh sent.");
      setTiltDetected(true);
      stopGyroscopeMonitoring();
    }
  };

  const startGyroscopeMonitoring = () => {
    if (window.DeviceOrientationEvent) {
      console.log("Gyroscope monitoring started.");
      window.addEventListener("deviceorientation", handleGyroscope, true);
    } else {
      console.error("Gyroscope is not supported on this device.");
    }
  };

  const stopGyroscopeMonitoring = () => {
    window.removeEventListener("deviceorientation", handleGyroscope);
  };

  const requestPermissionIfNeeded = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === "granted") {
          setPermissionGranted(true);
          startGyroscopeMonitoring();
        } else {
          console.error("Permission not granted for DeviceOrientationEvent.");
        }
      } catch (error) {
        console.error("Error requesting gyroscope permission:", error);
      }
    } else {
      setPermissionGranted(true); // Assume permissions are not needed
      startGyroscopeMonitoring();
    }
  };

  // Start gyroscope monitoring when the dialog is opened
  useEffect(() => {
    if (!message) {
      requestPermissionIfNeeded();
    }
    return () => stopGyroscopeMonitoring();
  }, [message]);

  // Handle tilt detection
  useEffect(() => {
    if (tiltDetected) {
      console.log("Tilt detected - sending Sladesh...");
      setTimeout(() => {
        onSladeshSent(); // Inform the parent component that Sladesh is sent
        onClose(); // Close the dialog
      }, 3000); // Wait 3 seconds for the confetti animation
    }
  }, [tiltDetected, onSladeshSent, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-[var(--bg-color)] p-6 rounded-lg shadow-heavy max-w-sm text-center">
        <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">
          {message ? "Sladesh Limit Reached" : "Send a Sladesh"}
        </h2>
        {message ? (
          <p className="text-[var(--text-muted)] mb-4">{message}</p>
        ) : !tiltDetected ? (
          <p className="text-[var(--text-muted)] mb-4">
            {permissionGranted
              ? "Tilt your phone to confirm sending the Sladesh."
              : "Please grant gyroscope access to send a Sladesh."}
          </p>
        ) : (
          <>
            <p className="text-[var(--secondary)] font-semibold mb-4">Sladesh Sent!</p>
            <Confetti width={window.innerWidth} height={window.innerHeight} />
          </>
        )}
        <button
          onClick={onClose}
          className={`py-2 px-4 rounded-lg shadow-md transition ${
            message
              ? "bg-[var(--secondary)] text-white hover:bg-[var(--highlight)]"
              : "bg-[var(--delete-btn)] text-white hover:bg-[var(--delete-btn)]/90"
          }`}
          disabled={tiltDetected && !message}
        >
          {message ? "Close" : "Cancel"}
        </button>
      </div>
    </div>
  );
};

export default SendSladeshDialog;
