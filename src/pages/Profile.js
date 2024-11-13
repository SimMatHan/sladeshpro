// src/pages/Profile.js
import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, query, where } from "firebase/firestore";
import './Profile.css';
import DesignProfilePicPopup from '../components/DesignProfilePicPopup';

const Profile = () => {
  const [userData, setUserData] = useState({});
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileBackgroundColor, setProfileBackgroundColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showDesignPopup, setShowDesignPopup] = useState(false);

  const [memberChannels, setMemberChannels] = useState([]); // Kanaler brugeren er medlem af
  const [otherChannels, setOtherChannels] = useState([]); // Kanaler brugeren ikke er medlem af
  const [selectedChannel, setSelectedChannel] = useState(null); // Valgt kanal
  const [accessCode, setAccessCode] = useState(''); // Adgangskode til kanalen
  const [error, setError] = useState(''); // Fejlmeddelelse

  const user = auth.currentUser;

  // Function to fetch user data from Firestore
  const fetchUserData = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setProfileImageUrl(data.profileImageUrl || "");
        setProfileBackgroundColor(data.profileBackgroundColor || "");
      }
    } catch (err) {
      console.error("Error fetching user data: ", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Function to fetch channels from Firestore
  const fetchChannels = useCallback(async () => {
    try {
      const channelSnapshot = await getDocs(collection(db, 'channels'));
      const allChannels = channelSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const memberChannels = [];
      const nonMemberChannels = [];

      for (const channel of allChannels) {
        const membersRef = collection(db, `channels/${channel.id}/members`);
        const memberQuery = query(membersRef, where('userUID', '==', user.uid));
        const memberSnapshot = await getDocs(memberQuery);

        if (!memberSnapshot.empty) {
          memberChannels.push(channel);
        } else {
          nonMemberChannels.push(channel);
        }
      }

      setMemberChannels(memberChannels);
      setOtherChannels(nonMemberChannels);
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  }, [user]);

  // Function to handle form submission (saving changes)
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);

      // Update Firestore with the new profile data
      await updateDoc(userDocRef, {
        profileImageUrl,
        profileBackgroundColor
      });

      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile: ", err);
      setMessage("Error updating profile. Please try again.");
    }
  };

  // Function to handle joining a channel
  const handleJoinChannel = async () => {
    if (!selectedChannel) return;

    if (accessCode === selectedChannel.accessCode) {
      const membersRef = collection(db, `channels/${selectedChannel.id}/members`);
      const memberDoc = {
        userName: user.displayName || 'Unknown User',
        userUID: user.uid,
      };

      const existingMembersQuery = query(membersRef, where('userUID', '==', user.uid));
      const existingMembersSnapshot = await getDocs(existingMembersQuery);

      if (existingMembersSnapshot.empty) {
        await addDoc(membersRef, memberDoc);
        setMemberChannels((prev) => [...prev, selectedChannel]);
        setOtherChannels((prev) => prev.filter((ch) => ch.id !== selectedChannel.id));
        setError('');
        alert(`You have successfully joined ${selectedChannel.name}`);
      } else {
        setError('You are already a member of this channel.');
      }
    } else {
      setError('Invalid access code. Please try again.');
    }
  };

  // Function to handle opening the avatar design popup
  const handleOpenDesignPopup = () => {
    setShowDesignPopup(true);
  };

  // Function to handle closing the avatar design popup
  const handleCloseDesignPopup = () => {
    setShowDesignPopup(false);
    fetchUserData();
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchChannels();
    }
  }, [user, fetchUserData, fetchChannels]);

  if (loading) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-page">
      <div className="profile-title">
        <h1>Profile</h1>
      </div>

      <div className="profile-content">
        <form className="profile-form" onSubmit={handleSaveChanges}>
          <div className="profile-picture-section">
            <div className="profile-details-container">
              <label>Profile Picture</label>
              <button
                type="button"
                className="design-profile-btn"
                onClick={handleOpenDesignPopup}
              >
                Design Profile Pic
              </button>
            </div>

            <div
              className="profile-image-preview"
              style={{
                background: profileBackgroundColor || "linear-gradient(135deg, #f0f0f0, #f0f0f0)",
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                fontSize: '48px',
                overflow: 'hidden'
              }}
            >
              <span className="avatar-emoji">{profileImageUrl || "👤"}</span>
            </div>
          </div>

          <div>
            <label>Username</label>
            <input
              type="text"
              value={userData.username || ""}
              disabled
              className="disabled-input"
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              value={userData.email || ""}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="save-btn-wrapper">
            <button type="submit" className="save-button">Save Changes</button>
          </div>

          {message && <p className="message">{message}</p>}
        </form>

        <h2>Your Channels</h2>
        <div className="profile-channels">
          {memberChannels.length > 0 ? (
            memberChannels.map((channel) => (
              <div key={channel.id} className="profile-channel-item member-channel">
                {channel.name} (Joined)
              </div>
            ))
          ) : (
            <p>You are not a member of any channels.</p>
          )}
        </div>

        <h2>Available Channels</h2>
        <div className="profile-channels">
          {otherChannels.length > 0 ? (
            otherChannels.map((channel) => (
              <div
                key={channel.id}
                className="profile-channel-item non-member-channel"
                onClick={() => setSelectedChannel(channel)}
              >
                {channel.name}
              </div>
            ))
          ) : (
            <p>There are no other channels available.</p>
          )}
        </div>

        {selectedChannel && (
          <div className="channel-access">
            <h3>Join {selectedChannel.name}</h3>
            <input
              type="password"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
            />
            <button onClick={handleJoinChannel}>Join Channel</button>
            {error && <p className="error-message">{error}</p>}
          </div>
        )}
      </div>

      {showDesignPopup && (
        <DesignProfilePicPopup onClose={handleCloseDesignPopup} />
      )}
    </div>
  );
};

export default Profile;
