import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

import markerShadow from "leaflet/dist/images/marker-shadow.png";


const BlueMarker = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const GreenMarker = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});


L.Marker.prototype.options.icon = GreenMarker;

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
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  // Fetch members' locations for the active channel
  useEffect(() => {
    const fetchMemberLocations = async () => {
      if (!activeChannel) return;
  
      try {
        // Fetch members from the active channel
        const membersRef = collection(db, `channels/${activeChannel}/members`);
        const snapshot = await getDocs(membersRef);
  
        const memberUIDs = snapshot.docs.map((doc) => doc.data().userUID);
  
        if (memberUIDs.length === 0) {
          setMemberLocations([]); // No members found
          return;
        }
  
        // Fetch user locations for the retrieved UIDs
        const usersRef = collection(db, "users");
        const usersQuery = query(
          usersRef,
          where("uid", "in", memberUIDs) // Filter by the member UIDs
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
  
        setMemberLocations(locations); // Update state with fetched locations
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

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    });
  
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`p-2 ${isOverlayOpen ? "opacity-50 pointer-events-none" : ""}`}>
      <div style={{ height: "calc(-250px + 100vh)", width: "100%" }}>
        <MapContainer
          center={currentPosition ? [currentPosition.latitude, currentPosition.longitude] : [55.6761, 12.5683]} // Center map on user's location or Copenhagen
          zoom={11}
          className="h-full w-full"
        >
      <TileLayer
        url={
          isDarkMode
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        }
        attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a> contributors'
      />

          {/* Grouped markers */}
          {groupedLocations.map((group, index) => {
            const firstLocation = group[0];
            return (
              <Marker
                key={index}
                position={[firstLocation.latitude, firstLocation.longitude]}
                icon={group.length > 1 ? BlueMarker : GreenMarker} // Use RedIcon if multiple markers are grouped
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
              icon={BlueMarker}
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
