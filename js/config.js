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

// How often (ms) we advance each plane along its path
const STEP_INTERVAL = 500;

// Here are two example “old” flight tracks. Each has an ID, a callsign,
// and a path of [lat, lon] waypoints. We’ll loop each path forever.
const sampleFlights = [
  {
    id: 'flight1',
    callsign: 'ABC123',
    path: [
      [41.8781, -87.6298],
      [42.0000, -87.0000],
      [42.2000, -86.5000],
      [42.5000, -85.5000],
      [42.7000, -85.0000],
    ],
  },
  {
    id: 'flight2',
    callsign: 'XYZ789',
    path: [
      [41.8000, -87.8000],
      [41.8500, -87.6000],
      [41.9000, -87.4000],
      [41.9500, -87.6000],
      [41.9000, -87.8000],
      [41.8500, -88.0000],
    ],
  },
];
