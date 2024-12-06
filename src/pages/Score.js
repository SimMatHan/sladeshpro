import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, query, doc, getDoc } from "firebase/firestore";

const Score = ({ activeChannel }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const sladeshSentSnapshot = await getDocs(collection(userDocRef, "sladeshSent"));
          const sladeshSent = sladeshSentSnapshot.docs.map((doc) => doc.data());

          const sladeshReceivedSnapshot = await getDocs(
            query(collection(db, `users/${user.uid}/sladesh`))
          );
          const sladeshReceived = sladeshReceivedSnapshot.docs.map((doc) => doc.data());

          setCurrentUser({
            id: user.uid,
            username: userDoc.data().username || "You",
            profileBackgroundColor: userDoc.data().profileBackgroundColor || "gray",
            profileImageUrl: userDoc.data().profileImageUrl || null,
            totalDrinks: Object.values(userDoc.data().drinks || {}).reduce(
              (sum, count) => sum + count,
              0
            ),
            drinks: userDoc.data().drinks || {},
            sladeshSent,
            sladeshReceived,
          });
        }
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (activeChannel) {
      fetchMembers(activeChannel);
    }
  }, [activeChannel, currentUser]);

  const fetchMembers = async (channelId) => {
    setLoading(true);
    try {
      const users = [];
      const membersRef = collection(db, `channels/${channelId}/members`);
      const membersDocs = await getDocs(membersRef);

      for (const member of membersDocs.docs) {
        const memberData = member.data();
        const userDocRef = doc(db, "users", memberData.userUID);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Only include users who are checked in
          if (userData.isCheckedIn) {
            const sladeshSentSnapshot = await getDocs(collection(userDocRef, "sladeshSent"));
            const sladeshSent = sladeshSentSnapshot.docs.map((doc) => doc.data());

            const sladeshReceivedSnapshot = await getDocs(
              query(collection(db, `users/${memberData.userUID}/sladesh`))
            );
            const sladeshReceived = sladeshReceivedSnapshot.docs.map((doc) => doc.data());

            users.push({
              id: memberData.userUID,
              username: userData.username || "Anonymous",
              profileBackgroundColor: userData.profileBackgroundColor || "gray",
              profileImageUrl: userData.profileImageUrl || null,
              totalDrinks: Object.values(userData.drinks || {}).reduce(
                (sum, count) => sum + count,
                0
              ),
              drinks: userData.drinks || {},
              sladeshSent,
              sladeshReceived,
            });
          }
        }
      }

      if (
        currentUser &&
        !users.some((user) => user.id === currentUser.id) &&
        currentUser.isCheckedIn
      ) {
        users.push(currentUser);
      }

      users.sort((a, b) => b.totalDrinks - a.totalDrinks);

      if (currentUser) {
        const currentUserRank = users.findIndex((member) => member.id === currentUser.id);
        setUserRank(currentUserRank + 1);
      }

      setMembers(users);
    } catch (error) {
      console.error("Error fetching members:", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (userId) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  return (
    <div className="p-4 bg-[var(--bg-color)] text-[var(--text-muted)]">
      <h2 className="text-xl font-bold mb-2 text-[var(--text-color)]">Leaderboard</h2>
      {currentUser && userRank && members.length > 0 && (
        <div className="mb-4 text-[var(--text-color)]">
          <p className="text-sm">
            You are ranked <span className="text-xl font-bold text-[var(--highlight)]">{userRank}</span> out of{" "}
            <span className="text-xl font-bold">{members.length}</span> members in this channel.
          </p>
        </div>
      )}
      {loading ? (
        <p className="text-[var(--text-muted)]">Loading leaderboard...</p>
      ) : members.length > 0 ? (
        <ul className="space-y-3">
          {members.map((member, index) => (
            <li
              key={member.id}
              className={`p-4 bg-[var(--bg-neutral)] rounded-lg shadow-md cursor-pointer ${currentUser && member.id === currentUser.id ? "font-bold" : ""
                }`}
              onClick={() => toggleExpand(member.id)}
            >
              {/* Member Overview */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {/* Dynamisk Profilbillede */}
                  <p className="text-lg font-medium text-[var(--text-color)]">
                    {index + 1}.
                  </p>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                      background: member.profileBackgroundColor || "gray", // Sæt baggrundsfarve
                    }}
                  >
                    {member.profileImageUrl ? (
                      <span className="text-2xl font-bold">{member.profileImageUrl}</span> // Hvis det er en emoji eller tekst
                    ) : (
                      <span className="text-white text-lg font-bold">
                        {member.username?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-[var(--text-color)]">
                      {member.username}
                      {currentUser && member.id === currentUser.id && (
                        <span className="text-sm text-[var(--secondary)]"> (You)</span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--secondary)]">
                  {member.totalDrinks}
                </p>
              </div>

              {/* Expanded Details */}
              {expandedUserId === member.id && (
                <div className="mt-4 bg-[var(--divider-color)] p-4 rounded-lg">
                  {/* Drinks Breakdown */}
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-[var(--secondary)] mb-2">
                      Drinks Breakdown
                    </h4>
                    <ul className="list-disc ml-4 text-sm">
                      {Object.entries(member.drinks).map(([drinkType, count]) => (
                        <li key={drinkType} className="mb-1">
                          {drinkType.replace("_", " ")}: <span className="font-bold">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sladesh Details */}
                  <div>
                    <h4 className="text-md font-semibold text-[var(--secondary)] mb-2">
                      Sladesh Details
                    </h4>
                    <div className="text-sm">
                      <p className="mb-2">
                        <strong>Sladesh Received From:</strong>{" "}
                        {member.sladeshReceived?.length ? (
                          member.sladeshReceived.map((sladesh, i) => (
                            <span key={i}>
                              {sladesh.fromName}
                              {i !== member.sladeshReceived.length - 1 && ", "}
                            </span>
                          ))
                        ) : (
                          <span className="italic text-[var(--text-muted)]">None</span>
                        )}
                      </p>
                      <p>
                        <strong>Sladesh Sent To:</strong>{" "}
                        {member.sladeshSent?.length ? (
                          member.sladeshSent.map((sladesh, i) => (
                            <span key={i}>
                              {sladesh.toName}
                              {i !== member.sladeshSent.length - 1 && ", "}
                            </span>
                          ))
                        ) : (
                          <span className="italic text-[var(--text-muted)]">None</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[var(--text-muted)]">No members found for this channel.</p>
      )}
    </div>
  );
};

export default Score;
