// js/flights.js

// Globals from config.js: sampleFlights, STEP_INTERVAL, map, paper

// We'll keep a record for each flight: its Paper node + flight data
const flightRecords = new Map();

/**
 * Fetch real-time flight data from OpenSky API
 */
async function fetchFlightData() {
  try {
    const bounds = map.getBounds();
    const response = await fetch(
      `${OPENSKY_API.baseUrl}/states/all?lamin=${bounds.getSouth()}&lomin=${bounds.getWest()}&lamax=${bounds.getNorth()}&lomax=${bounds.getEast()}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch flight data');
    }

    const data = await response.json();
    return data.states || [];
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return [];
  }
}

/**
 * Initialize flight visualization and start the update loop
 */
async function startFlightAnimation() {
  // Clear any existing flights
  flightRecords.clear();
  paper.project.activeLayer.removeChildren();

  // Initial fetch
  await updateFlights();

  // Update flights periodically
  if (window.animationInterval) {
    clearInterval(window.animationInterval);
  }
  window.animationInterval = setInterval(updateFlights, STEP_INTERVAL);
}

/**
 * Update flight positions and create new flight markers
 */
async function updateFlights() {
  const flights = await fetchFlightData();
  
  // Update existing flights and create new ones
  flights.forEach(flight => {
    const [icao24, callsign, origin, timePosition, lastContact, longitude, latitude, 
           baroAltitude, onGround, velocity, heading, verticalRate, sensors, 
           geoAltitude, squawk, spi, positionSource] = flight;

    // Skip flights without position data
    if (!latitude || !longitude) return;

    const flightId = icao24;
    const pt = map.latLngToLayerPoint([latitude, longitude]);

    if (flightRecords.has(flightId)) {
      // Update existing flight
      const record = flightRecords.get(flightId);
      record.node.position = new paper.Point(pt.x, pt.y);
      record.node.rotation = heading || 0;
      record.data = { callsign, altitude: baroAltitude, velocity };
    } else {
      // Create new flight marker
      const node = new paper.Path.RegularPolygon({
        center: new paper.Point(pt.x, pt.y),
        sides: 3,
        radius: 8,
        fillColor: new paper.Color(1, 1, 1, 0.8),
        strokeColor: new paper.Color(0, 0, 0, 0.8),
        strokeWidth: 2,
        data: { callsign, altitude: baroAltitude, velocity },
      });

      node.rotation = heading || 0;
      node.onClick = evt => showInfo(callsign, node, evt.event, baroAltitude, velocity);

      flightRecords.set(flightId, { node, data: { callsign, altitude: baroAltitude, velocity } });
    }
  });

  // Remove flights that are no longer in the data
  for (const [id, record] of flightRecords.entries()) {
    if (!flights.find(f => f[0] === id)) {
      record.node.remove();
      flightRecords.delete(id);
    }
  }

  // Force a redraw
  paper.view.draw();
}

/**
 * Show a popup with flight information when clicked
 */
function showInfo(callsign, node, domEvent, altitude, velocity) {
  document.getElementById('infoPopup')?.remove();
  const div = document.createElement('div');
  div.id = 'infoPopup';
  div.style = `
    position:absolute; pointer-events:none;
    background:rgba(255,255,255,0.9);
    padding:6px 10px; border-radius:4px;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    font-size:0.9em; z-index:900;
  `;
  
  // Format altitude and velocity
  const altitudeKm = Math.round(altitude / 100) / 10;
  const velocityKmh = Math.round(velocity * 3.6);
  
  div.innerHTML = `
    <strong>${callsign || 'Unknown'}</strong><br>
    Alt: ${altitudeKm} km<br>
    Speed: ${velocityKmh} km/h
  `;
  
  document.body.append(div);
  div.style.left = `${domEvent.clientX+10}px`;
  div.style.top  = `${domEvent.clientY+10}px`;
  setTimeout(() => div.remove(), 3000);
}

// Expose so map-init.js can call it
window.startFlightAnimation = startFlightAnimation;
