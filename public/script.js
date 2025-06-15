const mapboxToken = localStorage.getItem('mapboxToken') || prompt('Enter Mapbox token');
localStorage.setItem('mapboxToken', mapboxToken);

mapboxgl.accessToken = mapboxToken;
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: FEATURES[0].coords,
  zoom: 12,
});

let currentFeature = null;
let startTime = null;

const startBtn = document.getElementById('startBtn');
const resultEl = document.getElementById('result');
const timerEl = document.getElementById('timer');
const radiusInput = document.getElementById('radiusInput');
const scoreEl = document.getElementById('score');

let guessMarker = null;
let answerMarker = null;
let totalScore = 0;
let rounds = 0;

function randomFeature() {
  return FEATURES[Math.floor(Math.random() * FEATURES.length)];
}

function startChallenge() {
  currentFeature = randomFeature();
  startTime = Date.now();
  resultEl.textContent = `Find: ${currentFeature.name}`;
  timerEl.textContent = '';
  if (guessMarker) guessMarker.remove();
  if (answerMarker) answerMarker.remove();
}

function endChallenge(lngLat) {
  if (!currentFeature) return;
  const endTime = Date.now();
  const timeTaken = ((endTime - startTime) / 1000).toFixed(1);

  if (guessMarker) guessMarker.remove();
  if (answerMarker) answerMarker.remove();
  guessMarker = new mapboxgl.Marker({ color: 'blue' }).setLngLat(lngLat).addTo(map);
  answerMarker = new mapboxgl.Marker({ color: 'red' }).setLngLat(currentFeature.coords).addTo(map);

  const distance = turf.distance(turf.point(lngLat.toArray()), turf.point(currentFeature.coords), { units: 'kilometers' });
  const maxRadius = parseFloat(radiusInput.value);
  const score = Math.max(0, Math.floor((1 - Math.min(distance, maxRadius) / maxRadius) * 100));
  resultEl.textContent = `Actual: ${currentFeature.name} | Distance: ${distance.toFixed(2)} km | Time: ${timeTaken}s | Score: ${score}`;

  const history = JSON.parse(localStorage.getItem('history') || '[]');
  history.push({ feature: currentFeature.name, distance, time: timeTaken, score, date: new Date().toISOString() });
  localStorage.setItem('history', JSON.stringify(history));

  totalScore += score;
  rounds++;
  scoreEl.textContent = `Score: ${(totalScore / rounds).toFixed(1)}% (${rounds} rounds)`;
  currentFeature = null;
}

startBtn.addEventListener('click', startChallenge);

map.on('click', (e) => {
  endChallenge(e.lngLat);
});

function showHistory() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  console.table(history);
}

window.showHistory = showHistory;

// Directions API usage
async function findRoute(start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(',')};${end.join(',')}?geometries=geojson&access_token=${mapboxToken}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes[0];
}

window.findRoute = findRoute;
