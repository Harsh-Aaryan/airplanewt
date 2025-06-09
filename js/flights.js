// js/flights.js

// Globals from config.js: sampleFlights, STEP_INTERVAL, map, paper

// We'll keep a record for each flight: its Paper node + current waypoint index
const flightRecords = new Map();

/**
 * Initialize each flight at its first waypoint and start the loop.
 */
function startFlightAnimation() {
  sampleFlights.forEach(f => {
    // Project the first waypoint to pixel coords
    const [lat, lon] = f.path[0];
    const pt = map.latLngToLayerPoint([lat, lon]);

    // Create a simple triangle for this flight
    const node = new paper.Path.RegularPolygon({
      center: new paper.Point(pt.x, pt.y),
      sides: 3,
      radius: 6,
      fillColor: 'white',
      strokeColor: 'black',
      strokeWidth: 1,
      data: { callsign: f.callsign },
    });

    node.rotation = 0;
    node.onClick = evt => showInfo(f.callsign, node, evt.event);

    // Store it
    flightRecords.set(f.id, { node, index: 0 });
  });

  // Advance all flights every STEP_INTERVAL ms
  setInterval(stepAnimations, STEP_INTERVAL);
}

/**
 * Move each flight along its path by one waypoint.
 */
function stepAnimations() {
  flightRecords.forEach((rec, id) => {
    const flight = sampleFlights.find(f => f.id === id);
    // advance index
    rec.index = (rec.index + 1) % flight.path.length;
    const [lat, lon] = flight.path[rec.index];

    // re-project to map pixels
    const pt = map.latLngToLayerPoint([lat, lon]);
    rec.node.position = new paper.Point(pt.x, pt.y);

    // spin a bit for effect
    rec.node.rotation += 10;
  });
}

/**
 * Show a small popup with the callsign when the user clicks a triangle.
 */
function showInfo(callsign, node, domEvent) {
  document.getElementById('infoPopup')?.remove();
  const d = node.data;
  const div = document.createElement('div');
  div.id = 'infoPopup';
  
  // Format the data
  const altitudeKm = Math.round(altitude / 100) / 10;
  const velocityKmh = Math.round(velocity * 3.6);
  const verticalRate = flight[11] ? Math.round(flight[11] * 3.6) : 'N/A'; // Convert to km/h
  const squawk = flight[14] || 'N/A';
  const origin = flight[2] || 'N/A';
  const lastContact = flight[4] ? new Date(flight[4] * 1000).toLocaleTimeString() : 'N/A';
  
  div.style = `
    position: absolute;
    pointer-events: none;
    background: rgba(255, 255, 255, 0.95);
    padding: 12px 15px;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    font-size: 0.9em;
    z-index: 900;
    min-width: 200px;
    font-family: Arial, sans-serif;
  `;
  div.textContent = callsign;
  document.body.append(div);
  div.style.left = `${domEvent.clientX+10}px`;
  div.style.top  = `${domEvent.clientY+10}px`;
  setTimeout(() => div.remove(), 2000);
}

// expose for map-init.js
window.startFlightUpdates = startFlightUpdates;
