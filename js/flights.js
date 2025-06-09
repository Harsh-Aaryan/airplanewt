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
      node.onClick = evt => showInfo(callsign, node, evt.event, baroAltitude, velocity, flight);

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
 * Show a detailed popup with flight information when clicked
 */
function showInfo(callsign, node, domEvent, altitude, velocity, flight) {
  document.getElementById('infoPopup')?.remove();
  const div = document.createElement('div');
  div.id = 'infoPopup';
  
  // Format the data
  const altitudeKm = Math.round(altitude / 100) / 10;
  const velocityKmh = Math.round(velocity * 3.6);
  const verticalRate = flight[11] ? Math.round(flight[11] * 3.6) : 'N/A'; // Convert to km/h
  const squawk = flight[14] || 'N/A';
  const origin = flight[2] || 'N/A';
  const lastContact = flight[4] ? new Date(flight[4] * 1000).toLocaleTimeString() : 'N/A';
  
  // Create a more detailed popup with styling
  div.style = `
    position: absolute;
    pointer-events: none;
    background: rgba(255, 255, 255, 0.95);
    padding: 12px 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-size: 0.9em;
    z-index: 900;
    min-width: 200px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  `;
  
  // Create the content with better formatting
  div.innerHTML = `
    <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
      <strong style="font-size: 1.1em; color: #2c3e50;">${callsign || 'Unknown'}</strong>
    </div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 0.9em;">
      <span style="color: #666;">Origin:</span>
      <span>${origin}</span>
      
      <span style="color: #666;">Altitude:</span>
      <span>${altitudeKm} km</span>
      
      <span style="color: #666;">Speed:</span>
      <span>${velocityKmh} km/h</span>
      
      <span style="color: #666;">Vertical Rate:</span>
      <span>${verticalRate} km/h</span>
      
      <span style="color: #666;">Squawk:</span>
      <span>${squawk}</span>
      
      <span style="color: #666;">Last Update:</span>
      <span>${lastContact}</span>
    </div>
  `;
  
  // Position the popup
  document.body.append(div);
  
  // Ensure popup stays within viewport
  const rect = div.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = domEvent.clientX + 10;
  let top = domEvent.clientY + 10;
  
  // Adjust if popup would go off right edge
  if (left + rect.width > viewportWidth) {
    left = domEvent.clientX - rect.width - 10;
  }
  
  // Adjust if popup would go off bottom edge
  if (top + rect.height > viewportHeight) {
    top = domEvent.clientY - rect.height - 10;
  }
  
  div.style.left = `${left}px`;
  div.style.top = `${top}px`;
  
  // Remove popup after 5 seconds
  setTimeout(() => div.remove(), 5000);
}

// Expose so map-init.js can call it
window.startFlightAnimation = startFlightAnimation;
