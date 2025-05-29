// 1) Define the cities you want and their [south,north,west,east] bbox.
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
  // …add more as needed
];

// 2) OpenSky API endpoint
const OPEN_SKY_BASE = 'https://opensky-network.org/api/states/all';

// 3) (Optional) public CORS proxy for testing only
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

// in config.js
const AVIATIONSTACK_KEY = '4e4ee0af150cc3da3309ff29b2e8c69d';


// 4) Poll interval (ms)
const POLL_INTERVAL = 10_000;
