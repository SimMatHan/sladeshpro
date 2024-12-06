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
import DialogBoxReset from "../components/DialogBoxReset"; // Importér din dialogkomponent


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
    subtypes: ["Mojito", "Margarita", "Gin & Tonic", "Dark 'n Stormy", "White Russian", "Espresso Martini"] // Gin & Tonic is very popular in Denmark
  },
  {
    type: "Shots",
    icon: "🥃",
    subtypes: ["Tequila", "Jägermeister", "Fisk", "Gammel Dansk", "Snaps"] // Fisk and Gammel Dansk are iconic in Danish culture
  },
  {
    type: "Cider",
    icon: "🍏",
    subtypes: ["Apple", "Pear", "Mixed Berries", "Elderflower"] // Ciders are a common choice in Denmark
  },
  {
    type: "Spirits",
    icon: "🥂",
    subtypes: ["Rum", "Whiskey", "Vodka", "Cognac"] // Aquavit is quintessentially Danish 
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    <div className="p-2 bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col items-center h-auto">
      {/* Total Drinks Counter */}
      <div className="flex justify-between items-center w-full bg-[var(--bg-neutral)] rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col items-start">
          <p className="text-lg font-medium">Total drinks</p>
          <span className="text-4xl font-bold text-[var(--secondary)]">
            {totalDrinks}
          </span>
        </div>
        <button
          onClick={handleCheckIn}
          className={`py-2 px-4 rounded-lg text-[var(--text-color)] font-medium ${
            isCheckedIn
              ? "bg-[var(--disabled)] cursor-not-allowed text-[var(--text-muted)]"
              : "bg-[var(--primary)] hover:bg-[var(--highlight)]"
          }`}
          disabled={isCheckedIn}
        >
          {isCheckedIn ? "Checked In" : "Check In"}
        </button>
      </div>
  
      {/* Drink Category Icons */}
      <div className="grid grid-cols-4 gap-4 mb-8 w-full">
        {drinkCategories.map((category) => (
          <button
            key={category.type}
            onClick={() => setActiveCategory(category.type)}
            className={`flex items-center justify-center w-16 h-16 rounded-full shadow-md ${
              activeCategory === category.type
                ? "bg-[var(--highlight)] text-white"
                : "bg-[var(--primary)] text-white"
            }`}
          >
            <span className="text-2xl">{category.icon}</span>
          </button>
        ))}
        <button
          onClick={() => setIsDialogOpen(true)} // Åbn dialogboks
          className="flex items-center justify-center w-16 h-16 bg-[var(--delete-btn)] font-medium text-[var(--bg-neutral)] rounded-full shadow-md hover:bg-[var(--delete-btn)]/90"
        >
          Reset
        </button>
      </div>

      {isDialogOpen && (
        <DialogBoxReset
          onClose={() => setIsDialogOpen(false)} // Luk dialogen
          onConfirm={() => {
            handleResetDrinks(); // Reset drinks
            setIsDialogOpen(false); // Luk dialogen efter handling
          }}
        />
      )}
  
      {/* Subtypes for Selected Category */}
      {activeCategory && (
        <div className="grid grid-cols-2 gap-4 w-full mb-4">
          {drinkCategories
            .find((cat) => cat.type === activeCategory)
            .subtypes.map((subtype) => (
              <div
                key={subtype}
                className="flex flex-col items-center bg-[var(--bg-neutral)] rounded-lg shadow-md p-4"
              >
                {/* Title */}
                <span className="text-sm font-bold mb-2">{subtype}</span>
                {/* Buttons and Count */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSubtractDrink(activeCategory, subtype)}
                    className="w-8 h-8 bg-[var(--delete-btn)] text-white rounded-full flex items-center justify-center hover:bg-[var(--delete-btn)]/90"
                    disabled={!drinks[`${activeCategory}_${subtype}`]}
                  >
                    -
                  </button>
  
                  <span className="text-lg font-bold">
                    {drinks[`${activeCategory}_${subtype}`] || 0}
                  </span>
  
                  <button
                    onClick={() => handleAddDrink(activeCategory, subtype)}
                    className="w-8 h-8 bg-[var(--secondary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--secondary)]/90"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
  
};

export default Home;
