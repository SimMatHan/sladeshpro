// src/pages/Hub.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, query, where, setDoc } from 'firebase/firestore';

const Hub = () => {
   const [checkedInMembers, setCheckedInMembers] = useState([]); // Liste af medlemmer som er checket ind
   const [selectedMember, setSelectedMember] = useState(null); // Gemmer valgt medlem for at sende Sladesh

   useEffect(() => {
      const fetchUserChannel = async () => {
         const user = auth.currentUser;

         if (user) {
            try {
               const channelsSnapshot = await getDocs(collection(db, 'channels'));

               let userChannelId = null;
               for (const channelDoc of channelsSnapshot.docs) {
                  const membersRef = collection(db, `channels/${channelDoc.id}/members`);
                  const memberQuery = query(membersRef, where("userUID", "==", user.uid));
                  const memberSnapshot = await getDocs(memberQuery);

                  if (!memberSnapshot.empty) {
                     userChannelId = channelDoc.id;
                     break;
                  }
               }

               if (userChannelId) {
                  await fetchCheckedInMembers(userChannelId, user.uid);
               } else {
                  console.log("User is not a member of any channel.");
               }
            } catch (error) {
               console.error("Error fetching user channel:", error);
            }
         }
      };

      const fetchCheckedInMembers = async (channelId, currentUserId) => {
         try {
            const membersRef = collection(db, `channels/${channelId}/members`);
            const membersSnapshot = await getDocs(membersRef);

            const checkedInMembersData = [];
            for (const memberDoc of membersSnapshot.docs) {
               const memberData = memberDoc.data();
               const userDocRef = doc(db, "users", memberData.userUID);
               const userDoc = await getDoc(userDocRef);

               if (userDoc.exists()) {
                  const userData = userDoc.data();
                  if (userData.isCheckedIn && memberData.userUID !== currentUserId) {
                     checkedInMembersData.push({
                        uid: memberData.userUID,
                        userName: userData.username || "Unknown User",
                     });
                  }
               }
            }

            setCheckedInMembers(checkedInMembersData);
         } catch (error) {
            console.error("Error fetching checked-in members:", error);
         }
      };

      fetchUserChannel();
   }, []);

   const handleMemberClick = (member) => {
      setSelectedMember(member.uid === selectedMember ? null : member); // Vælg eller fravælg medlem
   };

   const handleSendSladesh = async (member) => {
      try {
         const sladeshRef = doc(collection(db, `users/${member.uid}/sladesh`)); // Opretter et nyt dokument i modtagerens `sladesh` subcollection
         await setDoc(sladeshRef, {
            from: auth.currentUser.displayName || "Anonymous",
            sent: new Date().toISOString(),
         });
         alert(`Sladesh sent to ${member.userName}!`);
      } catch (error) {
         console.error("Error sending Sladesh:", error);
         alert("Failed to send Sladesh.");
      }
   };

   return (
      <div className="px-4 py-6 text-center">
         <h1 className="text-2xl font-semibold mb-4">Welcome to the Hub</h1>
         <p className="text-gray-600">Connect with others in your channel.</p>

         <h2 className="mt-6 text-lg font-medium text-gray-700">Checked-in Members</h2>
         <ul className="mt-4 space-y-4">
            {checkedInMembers.length > 0 ? (
               checkedInMembers.map((member) => (
                  <li
                     key={member.uid}
                     className="bg-gray-100 p-4 rounded-lg shadow-md hover:bg-gray-200 cursor-pointer"
                     onClick={() => handleMemberClick(member)}
                  >
                     <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-semibold">{member.userName}</span>
                        {selectedMember && selectedMember.uid === member.uid && (
                           <button
                              className="ml-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              onClick={() => handleSendSladesh(member)}
                           >
                              Send Sladesh
                           </button>
                        )}
                     </div>
                  </li>
               ))
            ) : (
               <p className="text-gray-500">No members are currently checked in.</p>
            )}
         </ul>

         <h2 className="mt-8 text-lg font-medium text-gray-700">Received Sladesh</h2>
         {/* Placeholder for received Sladesh */}
         <p className="mt-2 text-gray-500">No Sladesh received yet.</p>
      </div>
   );
};

export default Hub;
