import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LeaderboardIcon from '../assets/LeaderboardFilled.svg'; // Path til Leaderboard ikon
import MapIcon from '../assets/MapIcon.svg'; // Path til Map ikon

// Standard Leaflet ikon import for at undgå manglende ikoner
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Overview = () => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [members, setMembers] = useState([]);
  const [checkedInMembers, setCheckedInMembers] = useState([]);
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Leaderboard');

  useEffect(() => {
    const fetchChannels = async () => {
      const channelsSnapshot = await getDocs(collection(db, 'channels'));
      const channelsData = channelsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChannels(channelsData);
      if (channelsData.length > 0) {
        setSelectedChannel(channelsData[0].id);
      }
    };

    fetchChannels();

    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    });
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      if (selectedChannel) {
        const membersRef = collection(db, `channels/${selectedChannel}/members`);
        const memberDocs = await getDocs(membersRef);
        const memberUIDs = memberDocs.docs.map((doc) => doc.data().userUID);

        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('uid', 'in', memberUIDs));
        const userDocs = await getDocs(userQuery);

        const membersData = userDocs.docs.map((doc) => {
          const userData = doc.data();
          return {
            id: doc.id,
            ...userData,
            totalDrinks: Object.values(userData.drinks || {}).reduce((sum, count) => sum + count, 0),
          };
        });

        setMembers(membersData.sort((a, b) => b.totalDrinks - a.totalDrinks));
        setCheckedInMembers(membersData.filter(member => member.isCheckedIn));
      }
    };

    fetchMembers();
  }, [selectedChannel]);

  const handleChannelChange = (event) => {
    setSelectedChannel(event.target.value);
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Overview</h1>

      {/* Kanal Vælger */}
      <div className="mb-4">
        <label htmlFor="channel" className="block font-semibold mb-1">Select Channel:</label>
        <select
          id="channel"
          value={selectedChannel || ""}
          onChange={handleChannelChange}
          className="p-2 w-full rounded border border-gray-300 focus:border-blue-500 focus:outline-none"
        >
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>
      </div>

      {/* Kategori-knapper med ikoner */}
      <div className="flex justify-center mb-6 space-x-2">
        {/* Leaderboard Button */}
        <button
          onClick={() => setActiveCategory('Leaderboard')}
          className={`flex items-center justify-center font-semibold rounded-lg transition-all duration-300 ${activeCategory === 'Leaderboard' ? 'bg-blue-600 text-white w-full py-2' : 'bg-gray-200 text-gray-600 w-10 h-10'
            }`}
        >
          <img src={LeaderboardIcon} alt="Leaderboard" className="h-5 w-5" />
          {activeCategory === 'Leaderboard' && <span className="ml-2">Leaderboard</span>}
        </button>

        {/* Map Button */}
        <button
          onClick={() => setActiveCategory('Map')}
          className={`flex items-center justify-center font-semibold rounded-lg transition-all duration-300 ${activeCategory === 'Map' ? 'bg-blue-600 text-white w-full py-2' : 'bg-gray-200 text-gray-600 w-10 h-10'
            }`}
        >
          <img src={MapIcon} alt="Map" className="h-5 w-5" />
          {activeCategory === 'Map' && <span className="ml-2">Map</span>}
        </button>
      </div>


      {/* Conditionally Render Leaderboard or Map Section */}
      {activeCategory === 'Leaderboard' ? (
        <div>
          <h2 className="text-xl font-semibold text-blue-600 mb-3">Leaderboard</h2>
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="bg-gray-50 p-4 rounded-lg shadow cursor-pointer"
                onClick={() => setExpandedMemberId(prevId => (prevId === member.id ? null : member.id))}
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{member.username}</span>
                  <span className="text-blue-500">{member.totalDrinks} drinks</span>
                </div>

                {expandedMemberId === member.id && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                    {Object.entries(member.drinks || {}).map(([drinkType, count]) => (
                      <div key={drinkType} className="flex justify-between py-1">
                        <span className="font-medium text-gray-700">{drinkType}</span>
                        <span className="font-semibold text-gray-800">{count} drinks</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold text-blue-600 mb-3">Map of Check-ins</h2>
          <div className="rounded-lg overflow-hidden shadow-lg h-80">
            {userLocation && (
              <MapContainer center={[userLocation.latitude, userLocation.longitude]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <Marker position={[userLocation.latitude, userLocation.longitude]}>
                  <Popup>You are here</Popup>
                </Marker>

                {members.map((member) => (
                  member.lastLocation && (
                    <Marker
                      key={member.id}
                      position={[member.lastLocation.latitude, member.lastLocation.longitude]}
                    >
                      <Popup>{member.username} - Last drink here</Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
