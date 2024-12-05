import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Fix for default Leaflet marker icon
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Default marker icon for all users
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Custom red marker for the current user
const RedIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

const MapPage = ({ activeChannel, isOverlayOpen }) => {
  const [memberLocations, setMemberLocations] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);

  // Fetch members' locations for the active channel
  useEffect(() => {
    const fetchMemberLocations = async () => {
      if (!activeChannel) return;

      try {
        const membersRef = collection(db, `channels/${activeChannel}/members`);
        const snapshot = await getDocs(membersRef);

        const memberUIDs = snapshot.docs.map((doc) => doc.data().userUID);

        // Fetch users' lastLocation based on their UID
        const usersRef = collection(db, "users");
        const usersQuery = query(
          usersRef,
          where("uid", "in", memberUIDs) // Get only users in the active channel
        );
        const usersSnapshot = await getDocs(usersQuery);

        const locations = [];
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (
            userData.lastLocation &&
            userData.lastLocation.latitude &&
            userData.lastLocation.longitude
          ) {
            locations.push({
              username: userData.username || "Unknown",
              latitude: userData.lastLocation.latitude,
              longitude: userData.lastLocation.longitude,
            });
          }
        });

        setMemberLocations(locations);
      } catch (error) {
        console.error("Error fetching member locations:", error);
      }
    };

    fetchMemberLocations();
  }, [activeChannel]);

  // Get current user's position
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error fetching current position:", error);
      }
    );
  }, []);

  // Group markers within a 5-meter radius
  const groupMarkersByProximity = (locations) => {
    const grouped = [];
    const visited = new Set();

    for (let i = 0; i < locations.length; i++) {
      if (visited.has(i)) continue;

      const group = [locations[i]];
      visited.add(i);

      for (let j = i + 1; j < locations.length; j++) {
        if (
          calculateDistance(
            locations[i].latitude,
            locations[i].longitude,
            locations[j].latitude,
            locations[j].longitude
          ) <= 5
        ) {
          group.push(locations[j]);
          visited.add(j);
        }
      }

      grouped.push(group);
    }

    return grouped;
  };

  const groupedLocations = groupMarkersByProximity(memberLocations);

  return (
    <div className={`p-2 ${isOverlayOpen ? "opacity-50 pointer-events-none" : ""}`}>
      <div style={{ height: "calc(-250px + 100vh)", width: "100%" }}>
        <MapContainer
          center={currentPosition ? [currentPosition.latitude, currentPosition.longitude] : [55.6761, 12.5683]} // Center map on user's location or Copenhagen
          zoom={11}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Grouped markers */}
          {groupedLocations.map((group, index) => {
            const firstLocation = group[0];
            return (
              <Marker
                key={index}
                position={[firstLocation.latitude, firstLocation.longitude]}
                icon={group.length > 1 ? RedIcon : DefaultIcon} // Use RedIcon if multiple markers are grouped
              >
                <Popup>
                  {group.length > 1 ? (
                    <div>
                      <strong>{group.length} users in this area:</strong>
                      <ul>
                        {group.map((loc, idx) => (
                          <li key={idx}>{loc.username}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>
                      <strong>{firstLocation.username}</strong>
                    </p>
                  )}
                </Popup>
              </Marker>
            );
          })}

          {/* Marker for current user */}
          {currentPosition && (
            <Marker
              position={[currentPosition.latitude, currentPosition.longitude]}
              icon={RedIcon}
            >
              <Popup>
                <p>
                  <strong>You are here</strong>
                </p>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
