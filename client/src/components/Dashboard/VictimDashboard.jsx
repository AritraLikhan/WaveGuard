import React, { useEffect, useState } from "react";
import VicSidebar from "./VicSidebar";
import "./VictimDashboard.css";
import axios from "axios";
import Layout from "../Layout/Layout";
import "../Dashboard/nearbyvolunteer.css";
import { useNavigate } from "react-router-dom";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { AiOutlineClose } from "react-icons/ai";
import NotificationList from "./NotificationList"
import ChatInterface from "./ChatInterface";
const VictimDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [selectedOption, setSelectedOption] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nearbyVolunteers, setnearbyVolunteers] = useState([]);
  const [loadingVolunteers, setloadingVolunteers] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [map, setMap] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);


  const [editMode, setEditMode] = useState({
    name: false,
    contact: false,
    email: false,
    location: false,
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };



  const handleEditToggle = (field) => {
    setEditMode((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleFieldChange = (field, value) => {
    setProfile((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const saveToDatabase = async (field, value) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        await axios.put(
          `/users/${user._id}`,
          { [field]: value },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        console.log("Updating field:", field, "with value:", value);
        
        // Update local state after successful save
        setProfile(prevState => ({
          ...prevState,
          [field]: value
        }));
      }
    } catch (error) {
      console.error("Error updating profile field:", error.response ? error.response.data : error);
      throw error; // Propagate error to caller
    }
  };

  const getDeviceLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`
          );

          console.log("Location response:", response.data);

          const address = response.data.address;
          const locationParts = [];
          if (address.city || address.town || address.village) {
            locationParts.push(address.city || address.town || address.village);
          }
          if (address.county) {
            locationParts.push(address.county);
          }
          if (address.state_district) {
            locationParts.push(address.state_district);
          }
          if (address.state) {
            locationParts.push(address.state);
          }

          const locationString = locationParts.join(", ");
          
          // Save directly to database
          await saveToDatabase("location", locationString);
          setGettingLocation(false);
        } catch (error) {
          console.error("Error getting or saving location:", error);
          alert("Error updating location. Please try again.");
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Error getting location. Please make sure location services are enabled.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const getCoordinates = async (locationString) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}`
      );
      if (response.data && response.data[0]) {
        return {
          lat: parseFloat(response.data[0].lat),
          lon: parseFloat(response.data[0].lon)
        };
      }
      throw new Error('Location not found');
    } catch (error) {
      console.error('Error getting coordinates:', error);
      throw error;
    }
  };

  const showDirections = async (volunteerLocation) => {
    try {
      setSelectedVolunteer(volunteerLocation);
      setShowMap(true);

      // Get coordinates for both locations
      const victimCoords = await getCoordinates(profile.location);
      const volunteerCoords = await getCoordinates(volunteerLocation);

      // Initialize map if not already initialized
      let mapInstance = map;
      if (!mapInstance) {
        mapInstance = L.map('map').setView([victimCoords.lat, victimCoords.lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);
        setMap(mapInstance);
      }

      // Remove existing routing control if any
      if (routingControl) {
        mapInstance.removeControl(routingControl);
      }

      // Add new routing control
      const newRoutingControl = L.Routing.control({
        waypoints: [
          L.latLng(victimCoords.lat, victimCoords.lon),
          L.latLng(volunteerCoords.lat, volunteerCoords.lon)
        ],
        routeWhileDragging: true,
        lineOptions: {
          styles: [{ color: '#3737d4', weight: 6 }]
        },
        // createMarker: function(i, waypoint, n) {
        //   const marker = L.marker(waypoint.latLng);
        //   marker.bindPopup(i === 0 ? "Your Location" : "Victim's Location");
        //   return marker;
        // }
      }).addTo(mapInstance);

      setRoutingControl(newRoutingControl);

    } catch (error) {
      console.error('Error showing directions:', error);
      alert('Error getting directions. Please try again.');
    }
  };

  useEffect(() => {
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [map]);



  const handleSaveChanges = async (field) => {
    try {
      await saveToDatabase(field, profile[field]);
    } catch (error) {
      console.error("Error saving changes:", error);
    } finally {
      setEditMode((prevState) => ({
        ...prevState,
        [field]: false,
      }));
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        try {
          const { data } = await axios.get(`/users/${user._id}`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });
          setProfile(data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching profile:", error.response ? error.response.data : error);
          setError("Error fetching profile.");
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchnearbyVolunteers = async () => {
      if (!profile.location) return;
      setloadingVolunteers(true);
      try {
        const { data } = await axios.get(`/victims/nearby`, {
          params: { location: profile.location },
        });
        setnearbyVolunteers(data.volunteers);
      } catch (err) {
        console.error("Error fetching nearby volunteers:", err);
      } finally {
        setloadingVolunteers(false);
      }
    };

    if (selectedOption === "nearbyvolunteer" && profile.location) {
      fetchnearbyVolunteers();
    }
  }, [selectedOption, profile]);



  return (
    <Layout>
      <div className="vicdashboard-container">
        <VicSidebar
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
        <div className="vicdashboard-content">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : selectedOption === "profile" ? (
            <div className="profile-section">
              <h1>Profile</h1>
              <div className="profile-field">
                <p>
                  <strong>Name:</strong>
                </p>
                {editMode.name ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                  />
                ) : (
                  <p>{profile.name}</p>
                )}
                <button
                  onClick={() =>
                    editMode.name
                      ? handleSaveChanges("name")
                      : handleEditToggle("name")
                  }
                >
                  {editMode.name ? "Save Changes" : "Edit"}
                </button>
              </div>
              <div className="profile-field">
                <p>
                  <strong>Contact:</strong>
                </p>
                {editMode.contact ? (
                  <input
                    type="text"
                    value={profile.contact}
                    onChange={(e) => handleFieldChange("contact", e.target.value)}
                  />
                ) : (
                  <p>{profile.contact}</p>
                )}
                <button
                  onClick={() =>
                    editMode.contact
                      ? handleSaveChanges("contact")
                      : handleEditToggle("contact")
                  }
                >
                  {editMode.contact ? "Save Changes" : "Edit"}
                </button>
              </div>
              <div className="profile-field">
                <p>
                  <strong>Email:</strong>
                </p>
                {editMode.email ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                  />
                ) : (
                  <p>{profile.email}</p>
                )}
                <button
                  onClick={() =>
                    editMode.email
                      ? handleSaveChanges("email")
                      : handleEditToggle("email")
                  }
                >
                  {editMode.email ? "Save Changes" : "Edit"}
                </button>
              </div>
              <div className="profile-field">
                <p>
                  <strong>Location:</strong>
                </p>
                {editMode.location ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                  />
                ) : (
                  <p>{profile.location}</p>
                )}
                <div className="location-buttons">
                  <button
                    onClick={() =>
                      editMode.location
                        ? handleSaveChanges("location")
                        : handleEditToggle("location")
                    }
                  >
                    {editMode.location ? "Save Changes" : "Edit"}
                  </button>
                  <button 
                    onClick={getDeviceLocation}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? "Getting location..." : "Set Device Location"}
                  </button>
                </div>
              </div>
            </div>
          ) : selectedOption === "nearbyvolunteer" ? (
            <div className="volunteers-section">
              <h1>Nearby Volunteers</h1>
              {showMap && (
            <div className="floating-map-container">
                  <div id="map" style={{ height: '400px', width: '100%' }}></div>
     <AiOutlineClose 
      className="close-map-icon" 
      onClick={() => {
        setShowMap(false);
        setSelectedVolunteer(null);
        if (routingControl && map) {
          map.removeControl(routingControl);
          setRoutingControl(null);
        }
      }} 
    />
                </div>
              )}
              {loadingVolunteers ? (
                <p>Loading nearby volunteers...</p>
              ) : (
                <div className="volunteer-cards">
                  {nearbyVolunteers.length > 0 ? (
                    nearbyVolunteers.map((volunteer) => (
                      <div key={volunteer._id} className="volunteer-card">
                        <h3>{volunteer.name}</h3>
                        <p>
                          <strong>Email:</strong> {volunteer.email}
                        </p>
                        <p>
                          <strong>Contact:</strong> {volunteer.contact}
                        </p>
                        <p>
                          <strong>Location:</strong> {volunteer.location}
                        </p>
                        <button 
                          className="direction-btn"
                          onClick={() => showDirections(volunteer.location)}
                          disabled={!profile.location}
                        >
                          {!profile.location ? "Set your location first" : "See Directions"}
                        </button>

                    <button
                      onClick={() => {
                        setSelectedOption("chat");
                        setSelectedVolunteer(volunteer);
                      }}
                    >
                      Chat
                    </button>
                    


                      </div>
                    ))
                  ) : (
                    <p>No volunteers found nearby.</p>
                  )}
                </div>
              )}
            </div>
          ): selectedOption === "notifications" ? ( // Add this new condition
            <NotificationList />
          )
           : selectedOption === "logout" ? (
            handleLogout()
          ) :
          selectedOption === "all-chat" ? (
            <ChatInterface currentUserId={profile._id} />
          ):  null}
        </div>
      </div>
    </Layout>
  );
};

export default VictimDashboard;