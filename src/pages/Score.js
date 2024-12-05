import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

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
  
      if (currentUser && !users.some((user) => user.id === currentUser.id) && currentUser.isCheckedIn) {
        users.push(currentUser);
      }
  
      users.sort((a, b) => b.totalDrinks - a.totalDrinks);
  
      if (currentUser) {
        const currentUserRank = users.findIndex(
          (member) => member.id === currentUser.id
        );
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
      <h2 className="text-xl font-semibold text-[var(--primary)] mb-3">
        Leaderboard
      </h2>
      {loading ? (
        <p className="text-[var(--text-muted)]">Loading leaderboard...</p>
      ) : members.length > 0 ? (
        <ul className="space-y-3">
          {members.map((member, index) => (
            <li
              key={member.id}
              className={`p-4 rounded-lg shadow flex flex-col cursor-pointer ${
                currentUser && member.id === currentUser.id
                  ? "bg-[var(--highlight)] font-bold"
                  : "bg-[var(--divider-color)]"
              }`}
              onClick={() => toggleExpand(member.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold text-[var(--primary)]">
                    {index + 1}.
                  </span>
                  <span className="text-lg text-[var(--text-muted)]">
                    {member.username}
                  </span>
                  {currentUser && member.id === currentUser.id && (
                    <span className="ml-2 text-sm text-[var(--secondary)]">
                      (You)
                    </span>
                  )}
                </div>
                <span className="text-[var(--primary)]">
                  {member.totalDrinks} drinks
                </span>
              </div>
              {expandedUserId === member.id && (
                <div className="mt-2 text-sm text-[var(--text-muted)]">
                  <p className="font-semibold text-[var(--secondary)]">
                    Drinks breakdown:
                  </p>
                  <ul className="list-disc ml-6">
                    {Object.entries(member.drinks).map(([drinkType, count]) => (
                      <li key={drinkType}>
                        {drinkType.replace("_", " ")}: {count}
                      </li>
                    ))}
                  </ul>
                  <p className="font-semibold mt-2 text-[var(--secondary)]">
                    Sladesh Details:
                  </p>
                  <ul className="ml-6">
                    <li>
                      <strong>Sladesh Received From:</strong>{" "}
                      {member.sladeshReceived?.length
                        ? member.sladeshReceived.map((sladesh, i) => (
                            <span key={i}>
                              {sladesh.fromName}
                              {i !== member.sladeshReceived.length - 1 && ", "}
                            </span>
                          ))
                        : "None"}
                    </li>
                    <li>
                      <strong>Sladesh Sent To:</strong>{" "}
                      {member.sladeshSent?.length
                        ? member.sladeshSent.map((sladesh, i) => (
                            <span key={i}>
                              {sladesh.toName}
                              {i !== member.sladeshSent.length - 1 && ", "}
                            </span>
                          ))
                        : "None"}
                    </li>
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[var(--text-muted)]">
          No members found for this channel.
        </p>
      )}
      {currentUser && userRank && members.length > 0 && (
        <div className="mt-6 p-4 bg-[var(--secondary)] text-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Your Rank</h3>
          <p>
            You are ranked{" "}
            <span className="font-bold text-[var(--highlight)]">{userRank}</span>{" "}
            out of <span className="font-bold">{members.length}</span> members in
            this channel.
          </p>
        </div>
      )}
    </div>
  );  
};

export default Score;
