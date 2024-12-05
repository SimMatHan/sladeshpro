import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, collection, getDocs, query, where, setDoc } from "firebase/firestore";

const ChannelSettings = () => {
  const [activeTab, setActiveTab] = useState("Channels");
  const [memberChannels, setMemberChannels] = useState([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [joinMessage, setJoinMessage] = useState("");

  const user = auth.currentUser;
  const defaultChannelId = "DenAbneKanal"; // ID for "Den Åbne Kanal"

  const fetchChannels = useCallback(async () => {
    try {
      const channelSnapshot = await getDocs(collection(db, "channels"));
      const allChannels = channelSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const userChannels = [];

      for (const channel of allChannels) {
        const membersRef = collection(db, `channels/${channel.id}/members`);
        const memberQuery = query(membersRef, where("userUID", "==", user.uid));
        const memberSnapshot = await getDocs(memberQuery);

        if (!memberSnapshot.empty) {
          userChannels.push(channel);
        }
      }

      // Ensure "Den Åbne Kanal" is included in the list
      const defaultChannel = allChannels.find((channel) => channel.id === defaultChannelId);
      if (defaultChannel && !userChannels.find((ch) => ch.id === defaultChannelId)) {
        // Add the user to "Den Åbne Kanal" if not already a member
        const defaultChannelMemberRef = doc(db, `channels/${defaultChannelId}/members/${user.uid}`);
        await setDoc(defaultChannelMemberRef, { userUID: user.uid, joinedAt: new Date() });
        userChannels.push(defaultChannel);
      }

      // Sort channels to ensure "Den Åbne Kanal" is on top
      const sortedChannels = userChannels.sort((a, b) => {
        if (a.id === defaultChannelId) return -1; // Move "Den Åbne Kanal" to the top
        if (b.id === defaultChannelId) return 1;
        return a.name.localeCompare(b.name); // Sort the rest alphabetically
      });

      setMemberChannels(sortedChannels);
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  }, [user]);

  const handleRequestNewChannel = () => {
    const email = "placeholder@example.com";
    const subject = "New Channel Request";
    const body = `User ${user.displayName || user.email} is requesting a new channel. Message: ${requestMessage}`;

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const handleJoinChannel = async () => {
    try {
      const channelQuery = query(
        collection(db, "channels"),
        where("accessCode", "==", accessCode)
      );
      const channelSnapshot = await getDocs(channelQuery);

      if (channelSnapshot.empty) {
        setJoinMessage("Invalid access code. Please try again.");
        return;
      }

      const channelDoc = channelSnapshot.docs[0];
      const channelId = channelDoc.id;

      // Add the user to the channel's members subcollection
      const membersRef = doc(db, `channels/${channelId}/members/${user.uid}`);
      await setDoc(membersRef, {
        userName: user.displayName || "Unknown User",
        userUID: user.uid,
        joinedAt: new Date(),
      });

      setJoinMessage("Successfully joined the channel!");
      setAccessCode("");
      fetchChannels(); // Refresh channels
    } catch (error) {
      console.error("Error joining channel:", error);
      setJoinMessage("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user, fetchChannels]);

  return (
    <div className="p-2">
      <div className="flex w-full border-b border-gray-300">
        <button
          onClick={() => setActiveTab("Channels")}
          className={`flex-1 py-4 text-center ${
            activeTab === "Channels"
              ? "border-b-4 border-blue-600 text-blue-600 font-semibold"
              : "text-gray-600"
          }`}
        >
          Join
        </button>
        <button
          onClick={() => setActiveTab("Request Channel")}
          className={`flex-1 py-4 text-center ${
            activeTab === "Request Channel"
              ? "border-b-4 border-blue-600 text-blue-600 font-semibold"
              : "text-gray-600"
          }`}
        >
          Request
        </button>
      </div>

      <div className="p-2">
        {activeTab === "Channels" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Channels</h2>
            {memberChannels.length > 0 ? (
              memberChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="p-4 bg-gray-100 rounded-md text-left"
                >
                  {channel.name} (Joined)
                </div>
              ))
            ) : (
              <p className="text-gray-500">You are not a member of any channels.</p>
            )}

            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-800">
                Join a Channel with Access Code
              </h3>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                className="w-full mt-3 p-3 border rounded border-gray-300 focus:border-blue-500"
              />
              <button
                onClick={handleJoinChannel}
                className="w-full mt-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Join Channel
              </button>
              {joinMessage && <p className="text-gray-500 mt-4">{joinMessage}</p>}
            </div>
          </div>
        )}

        {activeTab === "Request Channel" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Request a New Channel
            </h2>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Enter your channel request message"
              className="w-full p-4 border rounded-lg border-gray-300 focus:border-blue-500 text-gray-700 resize-none"
              rows="6"
            />
            <button
              onClick={handleRequestNewChannel}
              className="w-full py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Send Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSettings;
