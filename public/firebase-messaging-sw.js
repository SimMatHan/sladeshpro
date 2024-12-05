// Import Firebase libraries for Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6GJCKDt0IsysWBtv6QBJbXchr2DsZ6ZE",
  authDomain: "sladeshpro.firebaseapp.com",
  projectId: "sladeshpro",
  storageBucket: "sladeshpro.appspot.com",
  messagingSenderId: "818619367245",
  appId: "1:818619367245:web:44d4df20d2201ba50d4104",
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Modtaget baggrundsbesked:", payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.data.icon || "/fallback-icon.png" // Brug ikon fra data eller et fallback
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
