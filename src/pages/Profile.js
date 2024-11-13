// src/pages/Profile.js
import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, query, where } from "firebase/firestore";
import DesignProfilePicPopup from '../components/DesignProfilePicPopup';

const Profile = () => {
  const [userData, setUserData] = useState({});
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileBackgroundColor, setProfileBackgroundColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showDesignPopup, setShowDesignPopup] = useState(false);
  const [memberChannels, setMemberChannels] = useState([]);
  const [otherChannels, setOtherChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const user = auth.currentUser;

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

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { profileImageUrl, profileBackgroundColor });
      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile: ", err);
      setMessage("Error updating profile. Please try again.");
    }
  };

  const handleJoinChannel = async () => {
    if (!selectedChannel) return;

    if (accessCode === selectedChannel.accessCode) {
      const membersRef = collection(db, `channels/${selectedChannel.id}/members`);
      const memberDoc = { userName: user.displayName || 'Unknown User', userUID: user.uid };
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

  const handleOpenDesignPopup = () => {
    setShowDesignPopup(true);
  };

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
    return <p className="text-center text-gray-500">Loading profile...</p>;
  }

  return (
    <div className="">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">Profile</h1>

        <form onSubmit={handleSaveChanges} className="space-y-4">
          <div className="flex flex-col items-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-3"
              style={{ background: profileBackgroundColor || "linear-gradient(135deg, #f0f0f0, #f0f0f0)" }}
            >
              <span className="text-4xl">{profileImageUrl || "👤"}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenDesignPopup}
              className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-700"
            >
              Design Profile Pic
            </button>
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Username</label>
            <input
              type="text"
              value={userData.username || ""}
              disabled
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={userData.email || ""}
              disabled
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          <button type="submit" className="w-full py-2 text-white bg-blue-500 rounded hover:bg-blue-700">
            Save Changes
          </button>

          {message && <p className="mt-2 text-center text-green-500">{message}</p>}
        </form>

        <h2 className="mt-6 text-xl font-semibold text-blue-600">Your Channels</h2>
        <div className="space-y-2 mt-3">
          {memberChannels.length > 0 ? (
            memberChannels.map((channel) => (
              <div key={channel.id} className="p-3 bg-green-100 rounded-md">{channel.name} (Joined)</div>
            ))
          ) : (
            <p className="text-gray-500">You are not a member of any channels.</p>
          )}
        </div>

        <h2 className="mt-6 text-xl font-semibold text-blue-600">Available Channels</h2>
        <div className="space-y-2 mt-3">
          {otherChannels.length > 0 ? (
            otherChannels.map((channel) => (
              <div
                key={channel.id}
                className="p-3 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200"
                onClick={() => setSelectedChannel(channel)}
              >
                {channel.name}
              </div>
            ))
          ) : (
            <p className="text-gray-500">There are no other channels available.</p>
          )}
        </div>

        {selectedChannel && (
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800">Join {selectedChannel.name}</h3>
            <input
              type="password"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full mt-3 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleJoinChannel}
              className="w-full mt-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
            >
              Join Channel
            </button>
            {error && <p className="mt-2 text-red-500">{error}</p>}
          </div>
        )}

        {showDesignPopup && (
          <DesignProfilePicPopup onClose={handleCloseDesignPopup} />
        )}
      </div>
    </div>
  );
};

export default Profile;
