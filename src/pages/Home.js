// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import GuidePopup from '../components/GuidePopup';
import './Home.css';

const drinkOptions = [
    { type: 'beer', icon: '🍺' },
    { type: 'wine', icon: '🍷' },
    { type: 'cocktail', icon: '🍸' },
    { type: 'shots', icon: '🥃' },
];

const Home = () => {
    const [showGuide, setShowGuide] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [userChannel, setUserChannel] = useState(null);
    const [checkInMessage, setCheckInMessage] = useState("");
    const [isErrorMessage, setIsErrorMessage] = useState(false);
    const [drinks, setDrinks] = useState({});
    const [totalDrinks, setTotalDrinks] = useState(0);
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const user = auth.currentUser;

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setShowGuide(userData.showGuide);
                    setIsCheckedIn(userData.isCheckedIn || false);
                    setDrinks(userData.drinks || {});
                    setTotalDrinks(userData.totalDrinks || 0);

                    const channelsRef = collection(db, "channels");
                    const channelsSnapshot = await getDocs(channelsRef);
                    let userInChannel = null;

                    for (const channelDoc of channelsSnapshot.docs) {
                        const membersRef = collection(db, `channels/${channelDoc.id}/members`);
                        const memberQuery = query(membersRef, where("userUID", "==", user.uid));
                        const memberSnapshot = await getDocs(memberQuery);

                        if (!memberSnapshot.empty) {
                            userInChannel = {
                                id: channelDoc.id,
                                ...channelDoc.data()
                            };
                            break;
                        }
                    }
                    setUserChannel(userInChannel);
                }
            }
        };

        fetchUserData();
    }, [user]);

    useEffect(() => {
        if (totalDrinks === 10 || totalDrinks === 15 || totalDrinks === 20) {
            setPopupMessage(`Wow! You've reached ${totalDrinks} drinks!`);
            setPopupVisible(true);
        }
    }, [totalDrinks]);

    const handleCheckIn = async () => {
        if (user && userChannel) {
            try {
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, { isCheckedIn: true });
                setIsCheckedIn(true);
                setCheckInMessage("You are now checked in!");
                setIsErrorMessage(false);
            } catch (error) {
                console.error("Error checking in: ", error);
                setCheckInMessage("Error with check-in. Please try again.");
                setIsErrorMessage(true);
            }
        } else if (!userChannel) {
            setCheckInMessage("You need to join a channel first. Go to your Profile to join a channel.");
            setIsErrorMessage(true);
        }
    };

    const handleAddDrink = async (type) => {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const newDrinks = { ...drinks, [type]: (drinks[type] || 0) + 1 };

            try {
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, {
                    drinks: newDrinks,
                    totalDrinks: Object.values(newDrinks).reduce((a, b) => a + b, 0),
                    lastLocation: { latitude, longitude },
                    lastDrinkTime: new Date().toISOString()
                });
                setDrinks(newDrinks);
                setTotalDrinks(Object.values(newDrinks).reduce((a, b) => a + b, 0));
            } catch (error) {
                console.error("Error updating drinks and location:", error);
            }
        });
    };

    const handleSubtractDrink = async (type) => {
        if (drinks[type] > 0) {
            const newDrinks = { ...drinks, [type]: drinks[type] - 1 };
            const newTotal = totalDrinks - 1;

            setDrinks(newDrinks);
            setTotalDrinks(newTotal);

            if (user) {
                try {
                    await updateDoc(doc(db, 'users', user.uid), {
                        drinks: newDrinks,
                        totalDrinks: newTotal
                    });
                } catch (error) {
                    console.error("Error subtracting drinks:", error);
                }
            }
        }
    };

    const handleCloseGuide = () => setShowGuide(false);
    const handleDoNotShowAgain = async () => {
        if (user) {
            await updateDoc(doc(db, "users", user.uid), { showGuide: false });
        }
        setShowGuide(false);
    };

    return (
        <div className="home-container">
            <h1>Welcome to SladeshPro!</h1>
            <p>Track your hydration and stay on top of your goals.</p>
            <p>Navigate through the app to explore your stats, challenges, and more.</p>

            <button 
                onClick={handleCheckIn} 
                className="check-in-button" 
                disabled={isCheckedIn}
            >
                {isCheckedIn ? "You are checked in" : "Check In"}
            </button>

            {checkInMessage && (
                <p className={`check-in-message ${isErrorMessage ? 'error-message' : ''}`}>
                    {checkInMessage}
                </p>
            )}

            {showGuide && (
                <GuidePopup onClose={handleCloseGuide} onDoNotShowAgain={handleDoNotShowAgain} />
            )}

            {/* Drink Tracking Section */}
            <div className="drink-monitor-panel">
                <h2>Track Your Drinks</h2>

                <div className="drink-grid">
                    {drinkOptions.map((drink) => (
                        <div key={drink.type} className="drink-item-card">
                            <span className="drink-icon">{drink.icon}</span>
                            <button onClick={() => handleSubtractDrink(drink.type)} className="drink-control-button">-</button>
                            <span className="drink-count">{drinks[drink.type] || 0}</span>
                            <button onClick={() => handleAddDrink(drink.type)} className="drink-control-button">+</button>
                        </div>
                    ))}
                </div>

                <div className="drink-total">Total Drinks: {totalDrinks}</div>

                {popupVisible && (
                    <div className="popup-message">
                        <p>{popupMessage}</p>
                        <button onClick={() => setPopupVisible(false)}>OK</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
