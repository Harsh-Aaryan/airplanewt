// YOUR Google Maps API key already in index.html script tag

// 1) Define cities and their bounding-boxes
const cities = [
  {
    name: 'Chicago',
    center: { lat: 41.8781, lng: -87.6298 },
    // [south, north, west, east]
    bbox: [41.6, 42.1, -87.95, -87.5]
  },
  {
    name: 'New York',
    center: { lat: 40.7128, lng: -74.0060 },
    bbox: [40.5, 41.0, -74.3, -73.7]
  },
  // … add more
];

// 2) OpenSky “states/all” endpoint
const OPEN_SKY_BASE = 'https://opensky-network.org/api/states/all';

// Poll interval in ms
const POLL_INTERVAL = 10_000;
