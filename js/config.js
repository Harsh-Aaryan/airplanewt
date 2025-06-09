// js/config.js

// Your existing cities array:
const cities = [
  {
    name: 'Chicago',
    center: { lat: 41.8781, lng: -87.6298 },
    bbox: [41.6, 42.1, -87.95, -87.5],
  },
  {
    name: 'New York',
    center: { lat: 40.7128, lng: -74.0060 },
    bbox: [40.5, 41.0, -74.3, -73.7],
  },
  // …add more if you like
];

// How often (ms) we update flight positions
const STEP_INTERVAL = 5000; // Update every 5 seconds

// OpenSky API configuration
const OPENSKY_API = {
  baseUrl: 'https://opensky-network.org/api',
  // Using anonymous access (limited to 400 requests per day)
  // For more requests, you can register at https://opensky-network.org/
  credentials: {
    username: '',
    password: ''
  }
};

// Flight data storage
let activeFlights = new Map();

// Expose configuration
window.OPENSKY_API = OPENSKY_API;
window.activeFlights = activeFlights;
