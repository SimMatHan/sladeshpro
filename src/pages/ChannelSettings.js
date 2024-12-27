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

      const defaultChannel = allChannels.find((channel) => channel.id === defaultChannelId);
      if (defaultChannel && !userChannels.find((ch) => ch.id === defaultChannelId)) {
        const defaultChannelMemberRef = doc(db, `channels/${defaultChannelId}/members/${user.uid}`);
        await setDoc(defaultChannelMemberRef, { userUID: user.uid, joinedAt: new Date() });
        userChannels.push(defaultChannel);
      }

      const sortedChannels = userChannels.sort((a, b) => {
        if (a.id === defaultChannelId) return -1;
        if (b.id === defaultChannelId) return 1;
        return a.name.localeCompare(b.name);
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

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

      const membersRef = doc(db, `channels/${channelId}/members/${user.uid}`);
      await setDoc(membersRef, {
        userName: user.displayName || "Unknown User",
        userUID: user.uid,
        joinedAt: new Date(),
      });

      setJoinMessage("Successfully joined the channel!");
      setAccessCode("");
      fetchChannels();
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
    <div className="p-4 bg-[var(--bg-color)] min-h-screen">
      <div className="flex w-full rounded-full">
        <button
          onClick={() => setActiveTab("Channels")}
          className={`flex-1 py-2 mx-1 text-center rounded-full ${
            activeTab === "Channels"
              ? "bg-[var(--highlight)] text-[var(--text-color)] font-semibold"
              : "bg-[var(--bg-neutral)] text-[var(--text-color)]"
          }`}
        >
          Join
        </button>
        <button
          onClick={() => setActiveTab("Request Channel")}
          className={`flex-1 py-2 mx-1 text-center rounded-full ${
            activeTab === "Request Channel"
              ? "bg-[var(--highlight)] text-[var(--text-color)] font-semibold"
              : "bg-[var(--bg-neutral)] text-[var(--text-color)]"
          }`}
        >
          Request
        </button>
      </div>

      <div className="w-full border-b border-[var(--divider-color)] my-4"></div>

      <div>
        {activeTab === "Channels" && (
          <div className="space-y-4">
            <div className="mt-6">
              <h3 className="text-md font-semibold text-[var(--text-color)]">
                Join a Channel with Access Code
              </h3>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                className="w-full mt-3 p-3 border border-[var(--input-border)] rounded focus:border-[var(--highlight)]"
              />
              <button
                onClick={handleJoinChannel}
                className="w-full mt-4 py-3 bg-[var(--secondary)] text-[var(--text-color)] rounded-lg font-semibold hover:bg-[var(--highlight)] transition"
              >
                Join Channel
              </button>
              {joinMessage && <p className="text-[var(--text-muted)] mt-4">{joinMessage}</p>}
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-color)]">Your Channels</h2>
            {memberChannels.length > 0 ? (
              memberChannels.map((channel) => (
                <div key={channel.id} className="p-4 bg-[var(--bg-neutral)] rounded-md">
                  {channel.name} (Joined)
                </div>
              ))
            ) : (
              <p className="text-[var(--text-muted)]">You are not a member of any channels.</p>
            )}
          </div>
        )}

        {activeTab === "Request Channel" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[var(--text-color)]">Request a New Channel</h2>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Enter your channel request message"
              className="w-full p-4 border border-[var(--input-border)] rounded-lg focus:border-[var(--highlight)] text-[var(--text-color)] resize-none"
              rows="6"
            />
            <button
              onClick={handleRequestNewChannel}
              className="w-full py-4 bg-[var(--primary)] text-[var(--secondary)] rounded-lg font-semibold hover:bg-[var(--highlight)] transition"
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
