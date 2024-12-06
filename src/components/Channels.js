import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore"; // Removed updateDoc

const Channels = ({ activeChannel, setActiveChannel, onClose }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultChannelId = "DenAbneKanal"; // ID for "Den Åbne Kanal"

  useEffect(() => {
    const fetchChannels = async () => {
      const user = auth.currentUser;

      if (!user) {
        console.error("User is not logged in.");
        setChannels([]);
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching channels for user:", user.uid); // Debugging log

        // Get all channels
        const channelsSnapshot = await getDocs(collection(db, "channels"));
        const allChannels = channelsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter channels where the user is a member
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
          const defaultChannelMemberRef = doc(db, `channels/${defaultChannelId}/members`, user.uid);
          await setDoc(defaultChannelMemberRef, { userUID: user.uid });
          userChannels.push(defaultChannel);
        }

        // Sort channels to ensure "Den Åbne Kanal" is on top
        const sortedChannels = userChannels.sort((a, b) => {
          if (a.id === defaultChannelId) return -1; // Move "Den Åbne Kanal" to the top
          if (b.id === defaultChannelId) return 1;
          return a.name.localeCompare(b.name); // Sort the rest alphabetically
        });

        setChannels(sortedChannels);
        console.log("Fetched and sorted user channels:", sortedChannels); // Debugging log
      } catch (error) {
        console.error("Error fetching channels:", error);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const handleSelectChannel = (channelId) => {
    console.log("Selected Channel ID:", channelId); // Debugging log
    setActiveChannel(channelId);
    onClose();
  };

  return (
    <div className="fixed top-[50px] inset-0 flex justify-center items-start z-50">
      {/* Overlay */}
      <div
        className="fixed top-[60px] inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
  
      {/* Channels Container */}
      <div className="bg-[var(--bg-color)] rounded-b-lg shadow-heavy w-full md:w-3/4 lg:w-1/2 max-h-[80vh] p-4 mt-0 overflow-hidden transform translate-y-0">
        <h2 className="text-lg font-semibold text-[var(--text-color)] mb-4">
          Your Channels
        </h2>
  
        {loading ? (
          <p className="text-[var(--text-muted)]">Loading channels...</p>
        ) : (
          <div className="overflow-y-auto max-h-[60vh] space-y-4">
            {channels.length > 0 ? (
              channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleSelectChannel(channel.id)}
                  className={`block w-full text-left px-4 py-2 rounded-lg shadow-md transition ${
                    activeChannel === channel.id
                      ? "bg-[var(--primary)] text-[var(--secondary)] font-semibold"
                      : "bg-[var(--bg-neutral)] text-[var(--text-color)]"
                  } hover:bg-[var(--highlight)] hover:text-[var(--secondary)]`}
                >
                  {channel.name}
                </button>
              ))
            ) : (
              <p className="text-[var(--text-muted)]">No channels available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Channels;
