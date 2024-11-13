// src/pages/Overview.js
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Overview.css';

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

    // Få brugerens aktuelle position
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

  const toggleExpandMember = (memberId) => {
    setExpandedMemberId(prevId => (prevId === memberId ? null : memberId));
  };

  return (
    <div className="overview-page">
      <h1>Overview</h1>

      {/* Kanal Vælger */}
      <div className="channel-selector">
        <label htmlFor="channel">Select Channel:</label>
        <select id="channel" value={selectedChannel || ""} onChange={handleChannelChange}>
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard Sektion */}
      <div className="leaderboard-section">
        <h2>Leaderboard</h2>
        <ul className="leaderboard-list">
          {members.map((member) => (
            <li key={member.id} className="leaderboard-item" onClick={() => toggleExpandMember(member.id)}>
              <div className="leaderboard-item-header">
                <span className="leaderboard-name">{member.username}</span>
                <span className="leaderboard-score">{member.totalDrinks} drinks</span>
              </div>
              
              {/* Udvidet visning af drinks per type, hvis medlemmet er valgt */}
              {expandedMemberId === member.id && (
                <div className="drink-details">
                  {Object.entries(member.drinks || {}).map(([drinkType, count]) => (
                    <div key={drinkType} className="drink-detail">
                      <span className="drink-type">{drinkType}</span>
                      <span className="drink-count">{count} drinks</span>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Kort Sektion */}
      <div className="map-section">
        <h2>Map of Check-ins</h2>
        <div className="map-container">
          {userLocation && (
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={12}
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* Brugerens egen markør */}
              <Marker position={[userLocation.latitude, userLocation.longitude]}>
                <Popup>You are here</Popup>
              </Marker>

              {/* Markører for kanalmedlemmer */}
              {members.map((member) => (
                member.lastLocation && (
                  <Marker
                    key={member.id}
                    position={[member.lastLocation.latitude, member.lastLocation.longitude]}
                  >
                    <Popup>{member.username} - Lastest drink here</Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
