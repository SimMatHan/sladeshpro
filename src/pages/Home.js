// src/pages/Home.js
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";

const drinkCategories = [
  {
    type: "Beer",
    icon: "🍺",
    subtypes: ["Lager", "IPA", "Stout", "Pilsner", "Wheat Beer", "Sour"] // Pilsner is especially popular in Denmark 
  },
  {
    type: "Wine",
    icon: "🍷",
    subtypes: ["Red", "White", "Rosé", "Sparkling", "Gløgg"] // "Gløgg" is a favorite during the holiday season 
  },
  {
    type: "Cocktail",
    icon: "🍸",
    subtypes: ["Mojito", "Margarita", "Martini", "Gin & Tonic", "Dark 'n Stormy", "White Russian", "Espresso Martini"] // Gin & Tonic is very popular in Denmark
  },
  {
    type: "Shots",
    icon: "🥃",
    subtypes: ["Tequila", "Jägermeister", "Vodka", "Fisk", "Gammel Dansk", "Snaps"] // Fisk and Gammel Dansk are iconic in Danish culture
  },
  {
    type: "Cider",
    icon: "🍏",
    subtypes: ["Apple", "Pear", "Mixed Berries", "Elderflower"] // Ciders are a common choice in Denmark
  },
  {
    type: "Spirits",
    icon: "🥂",
    subtypes: ["Rum", "Whiskey", "Aquavit", "Cognac"] // Aquavit is quintessentially Danish 
  },
  {
    type: "Others",
    icon: "🚬",
    subtypes: ["Cigarettes", "Cigars", "Snus", "Vape", "Fjolle Tobak"] // Includes non-drink consumables
  }
];

const Home = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [userChannel, setUserChannel] = useState(null);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [drinks, setDrinks] = useState({});
  const [totalDrinks, setTotalDrinks] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsCheckedIn(userData.isCheckedIn || false);
          setDrinks(userData.drinks || {});
          setTotalDrinks(
            Object.entries(userData.drinks || {})
              .filter(([key]) => !key.startsWith("Others"))
              .reduce((sum, [, count]) => sum + count, 0)
          );

          const channelsRef = collection(db, "channels");
          const channelsSnapshot = await getDocs(channelsRef);

          for (const channelDoc of channelsSnapshot.docs) {
            const membersRef = collection(db, `channels/${channelDoc.id}/members`);
            const memberQuery = query(membersRef, where("userUID", "==", user.uid));
            const memberSnapshot = await getDocs(memberQuery);

            if (!memberSnapshot.empty) {
              setUserChannel({
                id: channelDoc.id,
                ...channelDoc.data(),
              });
              break;
            }
          }
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error fetching location:", error);
      }
    );
  }, []);


  const handleCheckIn = async () => {
    try {
      // Check if user, userChannel, and userLocation are available
      if (!user) {
        setCheckInMessage("You need to be logged in to check in.");
        setIsErrorMessage(true);
        return;
      }
      if (!userChannel) {
        setCheckInMessage("You need to join a channel to check in.");
        setIsErrorMessage(true);
        return;
      }
      if (!userLocation) {
        setCheckInMessage("Location access is required to check in.");
        setIsErrorMessage(true);
        return;
      }
  
      // Fetch user data
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
  
        // Update Firestore with check-in status and location
        await updateDoc(userDocRef, {
          isCheckedIn: true,
          lastLocation: userLocation,
        });
  
        setIsCheckedIn(true);
        setCheckInMessage("You are now checked in!");
        setIsErrorMessage(false);
  
        // Create a notification for the check-in
        await addDoc(collection(db, "notifications"), {
          channelId: userChannel.id,
          userId: user.uid,
          type: "check-in",
          message: `${userData.username || "A user"} just checked in!`,
          timestamp: Timestamp.now(),
          watched: false,
        });
      } else {
        setCheckInMessage("User data not found. Please try again.");
        setIsErrorMessage(true);
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      setCheckInMessage("An error occurred while checking in. Please try again.");
      setIsErrorMessage(true);
    }
  };
  

  const handleAddDrink = async (category, subtype) => {
    const key = `${category}_${subtype}`;
    const newDrinks = { ...drinks, [key]: (drinks[key] || 0) + 1 };
    setDrinks(newDrinks);
    const newTotalDrinks = category !== "Others" ? totalDrinks + 1 : totalDrinks;
    setTotalDrinks(newTotalDrinks);

    // Get user location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);

        if (user) {
          try {
            const userDocRef = doc(db, "users", user.uid);

            await updateDoc(userDocRef, {
              drinks: newDrinks,
              totalDrinks: newTotalDrinks,
              lastLocation: location,
            });

            if ([10, 20, 30].includes(newTotalDrinks)) {
              await addDoc(collection(db, "notifications"), {
                channelId: userChannel?.id,
                message: `${user.displayName || "User"} reached ${newTotalDrinks} total drinks!`,
                timestamp: Timestamp.now(),
                watched: false,
              });
            }
          } catch (error) {
            console.error("Error updating drinks or location:", error);
          }
        }
      },
      (error) => {
        console.error("Error fetching location:", error);
      }
    );
  };



  const handleSubtractDrink = async (category, subtype) => {
    const key = `${category}_${subtype}`;
    if (drinks[key] > 0) {
      const newDrinks = { ...drinks, [key]: drinks[key] - 1 };
      setDrinks(newDrinks); // Update local state

      const newTotalDrinks = category !== "Others" ? totalDrinks - 1 : totalDrinks;
      setTotalDrinks(newTotalDrinks); // Update local total drinks state

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);

          // Update Firestore
          await updateDoc(userDocRef, {
            drinks: newDrinks,
            totalDrinks: newTotalDrinks,
          });
        } catch (error) {
          console.error("Error updating drinks:", error);
        }
      }
    }
  };

  const handleResetDrinks = async () => {
    setDrinks({});
    setTotalDrinks(0);

    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          drinks: {},
          totalDrinks: 0,
        });
      } catch (error) {
        console.error("Error resetting drinks:", error);
      }
    }
  };


  return (
    <div className="text-center p-5 bg-[var(--bg-color)] text-[var(--text-color)]">
      <h1 className="text-2xl font-semibold mb-4">
        Welcome to SladeshPro!
      </h1>
  
      <button
        onClick={handleCheckIn}
        className={`w-full py-3 rounded-lg text-[var(--secondary)] font-semibold transition-all ${
          isCheckedIn
            ? "bg-[var(--disabled)] cursor-not-allowed text-[var(--text-muted)]"
            : "bg-[var(--primary)] hover:bg-[var(--highlight)]"
        }`}
        disabled={isCheckedIn}
      >
        {isCheckedIn ? "You are checked in" : "Check In"}
      </button>
  
      {checkInMessage && (
        <p
          className={`mt-3 text-sm ${
            isErrorMessage
              ? "text-[var(--delete-btn)] font-bold"
              : "text-[var(--text-muted)]"
          }`}
        >
          {checkInMessage}
        </p>
      )}
  
      <div className="mt-8">
        {/* Dropdown for Drink Categories */}
        <label
          htmlFor="drink-category"
          className="text-lg font-semibold"
        >
          Choose a drink type:
        </label>
        <select
          id="drink-category"
          className="block w-full mt-2 p-3 border border-[var(--input-border)] rounded-lg bg-[var(--bg-color)] text-[var(--text-muted)]"
          value={activeCategory || ""}
          onChange={(e) => setActiveCategory(e.target.value || null)}
        >
          <option value="">Select a category</option>
          {drinkCategories.map((category) => (
            <option key={category.type} value={category.type}>
              {category.icon} {category.type}
            </option>
          ))}
        </select>
  
        {/* Subtypes for Selected Category */}
        {activeCategory && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">
              {
                drinkCategories.find((cat) => cat.type === activeCategory)
                  .type
              }{" "}
              Subtypes
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {drinkCategories
                .find((cat) => cat.type === activeCategory)
                .subtypes.map((subtype) => (
                  <div
                    key={subtype}
                    className="flex items-center justify-between p-3 bg-[var(--divider-color)] rounded-lg shadow-md"
                  >
                    <span className="text-sm font-semibold">
                      {subtype}
                    </span>
                    <div className="flex items-center space-x-2">
                      {/* Subtract Drink Button */}
                      <button
                        onClick={() =>
                          handleSubtractDrink(activeCategory, subtype)
                        }
                        className="px-2 py-1 bg-[var(--delete-btn)] text-white rounded hover:bg-[var(--delete-btn)]/90"
                        disabled={!drinks[`${activeCategory}_${subtype}`]}
                      >
                        -
                      </button>
                      {/* Display Drink Count */}
                      <span className="text-lg font-semibold text-[var(--primary)]">
                        {drinks[`${activeCategory}_${subtype}`] || 0}
                      </span>
                      {/* Add Drink Button */}
                      <button
                        onClick={() =>
                          handleAddDrink(activeCategory, subtype)
                        }
                        className="px-2 py-1 bg-[var(--secondary)] text-white rounded hover:bg-[var(--secondary)]/90"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
  
        <div className="mt-5 text-lg font-semibold">
          Total Drinks: {totalDrinks}
        </div>
        <button
          onClick={handleResetDrinks}
          className="mt-4 py-2 px-4 bg-[var(--delete-btn)] text-white rounded-lg hover:bg-[var(--delete-btn)]/90"
        >
          Reset Drinks
        </button>
      </div>
    </div>
  );
};

export default Home;
