import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import Confirmation from "../components/Confirmation";
import SendSladeshDialog from "../components/SendSladeshDialog";

const Hub = ({ activeChannel }) => {
  const [activeTab, setActiveTab] = useState("Active");
  const [checkedInMembers, setCheckedInMembers] = useState([]);
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [message, setMessage] = useState("");
  const [sentSladesh, setSentSladesh] = useState([]);
  const [receivedSladesh, setReceivedSladesh] = useState([]);
  const [hasNewSladesh, setHasNewSladesh] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentSladesh, setCurrentSladesh] = useState(null);
  const [isGyroscopeEnabled, setIsGyroscopeEnabled] = useState(false);
  const [showSendSladeshDialog, setShowSendSladeshDialog] = useState(false);
  const [sladeshConfirmation, setSladeshConfirmation] = useState("");

  const fetchCheckedInMembers = async (channelId) => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) throw new Error("User not authenticated");

      // Hent currentUser's lastSladeshTimestamp
      const currentUserRef = doc(db, `users/${currentUserId}`);
      const currentUserDoc = await getDoc(currentUserRef);
      let currentUserCanSendSladesh = true;

      if (currentUserDoc.exists()) {
        const currentUserData = currentUserDoc.data();
        const lastSladeshTimestamp = currentUserData.lastSladeshTimestamp
          ? new Date(currentUserData.lastSladeshTimestamp)
          : null;

        const currentTime = new Date();
        currentUserCanSendSladesh =
          !lastSladeshTimestamp ||
          (currentTime - lastSladeshTimestamp) / (1000 * 60 * 60) >= 12; // 12-timers tjek
      }

      const membersRef = collection(db, `channels/${channelId}/members`);
      const membersSnapshot = await getDocs(membersRef);

      const checkedInMembersData = [];
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();

        if (!memberData.userUID) {
          console.warn(`Member document missing userUID: ${memberDoc.id}`);
          continue;
        }

        // Filtrer kun checked-in members og undgå den authenticated user
        if (memberData.userUID !== currentUserId) {
          const userDocRef = doc(db, `users/${memberData.userUID}`);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.isCheckedIn) {
              checkedInMembersData.push({
                uid: memberData.userUID,
                userName: userData.username || "Unknown User",
                canSendSladesh: currentUserCanSendSladesh, // Brug status for currentUser
              });
            }
          }
        }
      }

      setCheckedInMembers(checkedInMembersData);
    } catch (error) {
      console.error("Error fetching checked-in members:", error);
    }
  };


  const fetchSentSladesh = useCallback(async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId || !activeChannel) throw new Error("User not authenticated or no active channel");

      const sentRef = collection(db, `users/${currentUserId}/sladeshSent`);
      const sentSnapshot = await getDocs(sentRef);

      const sentData = await Promise.all(
        sentSnapshot.docs.map(async (sentDoc) => {
          const sladesh = { id: sentDoc.id, ...sentDoc.data() };

          // Ensure the sladesh matches the active channel
          if (sladesh.channelId !== activeChannel) {
            return null;
          }

          // Check completion status from recipient's Sladesh document
          const receiverSladeshRef = doc(db, `users/${sladesh.toUID}/sladesh/${sladesh.id}`);
          const receiverSladeshDoc = await getDoc(receiverSladeshRef);

          sladesh.completed = receiverSladeshDoc.exists() && receiverSladeshDoc.data().completed;
          return sladesh;
        })
      );

      setSentSladesh(
        sentData.filter(Boolean).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
      );
    } catch (error) {
      console.error("Error fetching sent Sladesh:", error);
    }
  }, [activeChannel]);

  const fetchReceivedSladesh = useCallback(async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId || !activeChannel) throw new Error("User not authenticated or no active channel");

      const receivedRef = collection(db, `users/${currentUserId}/sladesh`);
      const receivedSnapshot = await getDocs(receivedRef);

      const receivedData = (
        await Promise.all(
          receivedSnapshot.docs.map(async (docSnap) => {
            const sladesh = { id: docSnap.id, ...docSnap.data() };

            // Ensure the sladesh matches the active channel
            if (sladesh.channelId !== activeChannel) {
              return null;
            }

            // Fetch sender's username if missing or fallback to "Anonymous"
            if (sladesh.fromUID) {
              const senderDocRef = doc(db, "users", sladesh.fromUID);
              const senderDoc = await getDoc(senderDocRef);
              sladesh.fromName = senderDoc.exists()
                ? senderDoc.data().username || "Anonymous"
                : "Anonymous";
            } else {
              sladesh.fromName = "Anonymous";
            }

            return sladesh;
          })
        )
      ).filter(Boolean).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

      setReceivedSladesh(receivedData);

      // Update "New" notification status
      const hasNew = receivedData.some((sladesh) => !sladesh.completed);
      setHasNewSladesh(hasNew);
    } catch (error) {
      console.error("Error fetching received Sladesh:", error);
    }
  }, [activeChannel]);


  const handleMemberClick = (member) => {
    if (expandedMemberId === member.uid) {
      // Fjern gyroskop-monitorering, hvis medlemmet fravælges
      setExpandedMemberId(null);
      stopGyroscopeMonitoring(); // Stop gyroskop-monitorering
      setMessage("");
    } else {
      // Start gyroskop-monitorering, hvis medlemmet vælges
      setExpandedMemberId(member.uid);
      requestGyroscopePermission(); // Bed om tilladelse til gyroskop
      setMessage("");
    }
  };


  const handleSendSladesh = async (member) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !activeChannel)
        throw new Error("User not authenticated or no active channel");

      const senderUID = currentUser.uid;
      const senderDocRef = doc(db, "users", senderUID);
      const senderDoc = await getDoc(senderDocRef);

      if (!senderDoc.exists()) {
        throw new Error("Sender data not found in Firestore");
      }

      const senderData = senderDoc.data();
      const senderName = senderData.username || "Anonymous";

      const currentTime = new Date();
      const sladeshId = `${Date.now()}-${member.uid}`;

      const receiverSladeshRef = doc(
        db,
        `users/${member.uid}/sladesh/${sladeshId}`
      );
      await setDoc(receiverSladeshRef, {
        id: sladeshId,
        fromUID: senderUID,
        fromName: senderName,
        channelId: activeChannel,
        message: message,
        sentAt: currentTime.toISOString(),
        completed: false,
      });

      const senderSladeshRef = doc(
        db,
        `users/${senderUID}/sladeshSent/${sladeshId}`
      );
      await setDoc(senderSladeshRef, {
        id: sladeshId,
        toUID: member.uid,
        toName: member.userName,
        channelId: activeChannel,
        message: message,
        sentAt: currentTime.toISOString(),
      });

      const notificationRef = doc(collection(db, "notifications"));
      await setDoc(notificationRef, {
        channelId: activeChannel,
        recipientUID: member.uid,
        message: `${senderName} has sent a Sladesh to ${member.userName}`,
        timestamp: currentTime,
        watched: false,
      });

      await updateDoc(senderDocRef, {
        lastSladeshTimestamp: currentTime.toISOString(),
      });

      setSladeshConfirmation(`Sladesh successfully sent to ${member.userName}! 🎉`);
      setTimeout(() => {
        setSladeshConfirmation(""); // Clear confirmation message after 5 seconds
      }, 3000);

      setMessage("");
      setExpandedMemberId(null);
    } catch (error) {
      console.error("Error sending Sladesh:", error);
      setSladeshConfirmation("Failed to send Sladesh. Please try again.");
      setTimeout(() => {
        setSladeshConfirmation(""); // Clear error message after 5 seconds
      }, 3000);
    }
  };

  const handleCompleteSladesh = (sladeshId, fromUID) => {
    setCurrentSladesh({ sladeshId, fromUID });
    setShowConfirmation(true);
  };

  const confirmCompleteSladesh = async () => {
    try {
      const { sladeshId, fromUID } = currentSladesh;
      const currentUserId = auth.currentUser?.uid;

      if (!currentUserId) throw new Error("User not authenticated");

      const sladeshRef = doc(db, `users/${currentUserId}/sladesh/${sladeshId}`);
      const senderSladeshRef = doc(
        db,
        `users/${fromUID}/sladeshSent/${sladeshId}`
      );

      const sladeshDoc = await getDoc(sladeshRef);
      const senderDoc = await getDoc(senderSladeshRef);

      if (!sladeshDoc.exists() || !senderDoc.exists()) {
        throw new Error(
          `Document does not exist: sladeshId ${sladeshId} or fromUID ${fromUID}`
        );
      }

      // Update Firestore
      await updateDoc(sladeshRef, { completed: true });
      await updateDoc(senderSladeshRef, { completed: true });

      fetchReceivedSladesh();
      alert("Sladesh completed!");
    } catch (error) {
      console.error("Error completing Sladesh:", error);
      alert("Failed to complete Sladesh.");
    } finally {
      setShowConfirmation(false);
      setCurrentSladesh(null);
    }
  };

  const handleGyroscope = (event) => {
    const beta = event.beta !== null ? event.beta : 0; // Registrer hældning
    if (beta < -15) { // Justér vinklen efter behov
      console.log("Gyroscope detected tilt, triggering Sladesh!");
      stopGyroscopeMonitoring(); // Stop gyroskopet, når Sladesh aktiveres

      // Trigger Sladesh, hvis et medlem er valgt
      if (expandedMemberId) {
        const selectedMember = checkedInMembers.find(
          (member) => member.uid === expandedMemberId
        );
        if (selectedMember) {
          handleSendSladesh(selectedMember);
        }
      }
    }
  };

  const startGyroscopeMonitoring = () => {
    if (window.DeviceOrientationEvent) {
      console.log("Gyroscope monitoring started.");
      window.addEventListener("deviceorientation", handleGyroscope, true);
      setIsGyroscopeEnabled(true);
    } else {
      console.error("Gyroscope is not supported on this device.");
    }
  };

  const stopGyroscopeMonitoring = () => {
    window.removeEventListener("deviceorientation", handleGyroscope);
    setIsGyroscopeEnabled(false);
  };

  const requestGyroscopePermission = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === "granted") {
          startGyroscopeMonitoring();
        } else {
          console.error("Permission not granted for DeviceOrientationEvent.");
        }
      } catch (error) {
        console.error("Error requesting gyroscope permission:", error);
      }
    } else {
      startGyroscopeMonitoring();
    }
  };

  useEffect(() => {
    if (activeChannel) {
      fetchCheckedInMembers(activeChannel);
    }
  }, [activeChannel]);

  useEffect(() => {
    // Stop gyroskop-monitorering ved unmount
    return () => {
      stopGyroscopeMonitoring();
    };
  }, []);

  useEffect(() => {
    if (activeTab === "Sent") {
      fetchSentSladesh();
    } else if (activeTab === "Inbox") {
      fetchReceivedSladesh();
    }
  }, [activeTab, fetchSentSladesh, fetchReceivedSladesh]);

  return (
    <div className="p-2">
      {sladeshConfirmation && (
        <div className="mb-4 text-center text-green-500 font-semibold">
          {sladeshConfirmation}
        </div>
      )}
      {showSendSladeshDialog && (
        <SendSladeshDialog
          onClose={() => {
            setShowSendSladeshDialog(false);
            stopGyroscopeMonitoring();
          }}
          onSladeshSent={() => {
            const selectedMember = checkedInMembers.find(
              (member) => member.uid === expandedMemberId
            );
            if (selectedMember) {
              handleSendSladesh(selectedMember); // Udløs send
            }
            setSladeshConfirmation("Sladesh successfully sent! 🎉");
          }}
          message={message} // Pass the error or success message
        />
      )}
      {showConfirmation && (
        <Confirmation
          title="Confirm Completion"
          message="Are you sure you want to confirm the drink is completed?"
          onConfirm={confirmCompleteSladesh}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
      {/* Tab Navigation */}
      {/* Tab Navigation */}
      <div className="flex justify-between items-center rounded-full mb-4">
        <button
          onClick={() => setActiveTab("Active")}
          className={`flex-1 py-2 mx-1 text-center rounded-full ${activeTab === "Active"
            ? "bg-[var(--highlight)] text-[var(--secondary)] font-semibold"
            : "bg-[var(--primary)] text-[var(--secondary)]"
            }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab("Sent")}
          className={`flex-1 py-2 mx-1 text-center rounded-full ${activeTab === "Sent"
            ? "bg-[var(--highlight)] text-[var(--secondary)] font-semibold"
            : "bg-[var(--primary)] text-[var(--secondary)]"
            }`}
        >
          Sent
        </button>
        <button
          onClick={() => setActiveTab("Inbox")}
          className={`flex-1 py-2 mx-1 text-center rounded-full ${activeTab === "Inbox"
            ? "bg-[var(--highlight)] text-[var(--secondary)] font-semibold"
            : "bg-[var(--primary)] text-[var(--secondary)]"
            }`}
        >
          Inbox
          {hasNewSladesh && (
            <span className="absolute top-1 right-3 bg-[var(--delete-btn)] text-white text-xs rounded-full px-2">
              New
            </span>
          )}
        </button>
      </div>



      {/* Tab Content */}
      <div>
        {activeTab === "Active" && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-[var(--text-color)]">
              Active Members
            </h2>
            <ul className="space-y-4">
              {checkedInMembers.map((member) => (
                <li
                  key={member.uid}
                  className="bg-[var(--bg-neutral)] p-4 rounded-lg shadow flex items-center justify-between"
                >
                  {/* Profilbillede */}
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold text-white"
                      style={{
                        background: member.profileBackgroundColor || "#CCCCCC",
                      }}
                    >
                      {member.profileImageUrl ? (
                        <span>{member.profileImageUrl}</span>
                      ) : (
                        <span>{member.userName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {/* Brugerens Navn */}
                    <span className="text-[var(--text-color)] font-medium">
                      {member.userName}
                    </span>
                  </div>
                  {/* Send Sladesh Knap */}
                  <button
                    onClick={() => {
                      if (member.canSendSladesh) {
                        setExpandedMemberId(member.uid);
                        setShowSendSladeshDialog(true);
                      }
                    }}
                    disabled={!member.canSendSladesh}
                    className={`py-2 px-4 rounded-lg text-sm font-medium ${member.canSendSladesh
                      ? "bg-[var(--primary)] text-white hover:bg-[var(--highlight)]"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed"
                      }`}
                  >
                    {member.canSendSladesh ? "Send Sladesh" : "Sladesh Used"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "Sent" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-[var(--text-color)]">
              Sent Sladeshes
            </h2>
            <ul className="space-y-4">
              {sentSladesh.map((sladesh) => (
                <li
                  key={sladesh.id}
                  className={`p-4 rounded-lg shadow-md flex justify-between items-center ${sladesh.completed
                    ? "bg-[var(--primary)]"
                    : "bg-[var(--bg-neutral)]"
                    }`}
                >
                  <div>
                    <p className="text-[var(--text-color)] font-semibold">
                      Sladesh sent to:{" "}
                      <span className="text-[var(--secondary)]">{sladesh.toName}</span>
                    </p>
                    <p className="text-[var(--text-muted)] text-sm">
                      {new Date(sladesh.sentAt).toLocaleDateString()}{" "}
                      {new Date(sladesh.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${sladesh.completed
                      ? "text-[var(--secondary)]"
                      : "text-[var(--text-muted)]"
                      }`}
                  >
                    {sladesh.completed ? "Completed" : "Not Completed"}
                  </p>
                </li>
              ))}
            </ul>
          </div>

        )}

        {activeTab === "Inbox" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-[var(--text-color)]">
              Received Sladeshes
            </h2>
            <ul className="space-y-4">
              {receivedSladesh.map((sladesh) => (
                <li
                  key={sladesh.id}
                  className={`p-4 rounded-lg shadow-md flex justify-between items-center ${sladesh.completed
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--bg-neutral)]"
                    }`}
                >
                  <div>
                    <p
                      className={`font-semibold ${sladesh.completed
                          ? "text-[var(--secondary)]"
                          : "text-[var(--text-color)]"
                        }`}
                    >
                      Sladesh sent from:{" "}
                      <span className="text-[var(--secondary)]">{sladesh.fromName}</span>
                    </p>
                    <p className="text-[var(--text-muted)] text-sm">
                      {new Date(sladesh.sentAt).toLocaleDateString()}{" "}
                      {new Date(sladesh.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!sladesh.completed ? (
                    <button
                      onClick={() =>
                        handleCompleteSladesh(sladesh.id, sladesh.fromUID)
                      }
                      className="py-2 px-4 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--highlight)] transition"
                    >
                      Complete
                    </button>
                  ) : (
                    <span className="font-semibold text-[var(--secondary)]">
                      Completed
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

        )}
      </div>
    </div>
  );
};

export default Hub;
