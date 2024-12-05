import React, { useRef, useState } from "react";

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCapturing(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access the camera.");
    }
  };

  const handleCapture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640; // Default width
    canvas.height = videoRef.current.videoHeight || 480; // Default height
    const context = canvas.getContext("2d");
    if (videoRef.current) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoDataURL = canvas.toDataURL("image/png");
      onCapture(photoDataURL);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCapturing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg p-4 shadow-lg">
        <video ref={videoRef} className="rounded-md mb-4 w-full" />
        <div className="flex justify-between">
          {!isCapturing ? (
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={handleCapture}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
