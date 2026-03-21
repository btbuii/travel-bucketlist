import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTRY_CENTERS, CITY_CENTERS } from '../data/coordinates';
import { getFlagUrl } from '../data/defaultData';
import { FiCheckCircle, FiCompass } from 'react-icons/fi';

function makeDivIcon(color) {
  return L.divIcon({
    className: 'home-map-pin',
    html: `<svg width="20" height="28" viewBox="0 0 20 28"><path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.48 15.52 0 10 0z" fill="${color}"/><circle cx="10" cy="10" r="4" fill="#fff"/></svg>`,
    iconSize: [20, 28],
    iconAnchor: [10, 28],
    popupAnchor: [0, -28],
  });
}

const visitedIcon = makeDivIcon('#0d7377');
const plannedIcon = makeDivIcon('#4b5563');

function classifyData(countries) {
  const beenTo = [];
  const planTo = [];

  for (const country of countries) {
    const visitedCities = country.cities.filter((c) => c.visited);
    const unvisitedCities = country.cities.filter((c) => !c.visited);
    const hasTrips = (country.trips || 0) > 0;
    const isPartiallyVisited = visitedCities.length > 0 || hasTrips;

    if (isPartiallyVisited) {
      beenTo.push({ ...country, filteredCities: visitedCities });
    }
    if (unvisitedCities.length > 0 || (!isPartiallyVisited && country.cities.length === 0)) {
      planTo.push({ ...country, filteredCities: unvisitedCities });
    }
  }
  return { beenTo, planTo };
}

function lookupCityCenter(city) {
  if (CITY_CENTERS[city.id]) return CITY_CENTERS[city.id];
  const slug = city.name.toLowerCase().replace(/\s+/g, '-');
  if (CITY_CENTERS[slug]) return CITY_CENTERS[slug];
  return null;
}

function buildPins(countries) {
  const pins = [];
  for (const country of countries) {
    const hasTrips = (country.trips || 0) > 0;
    const anyVisited = country.cities.some((c) => c.visited);
    const countryVisited = hasTrips || anyVisited;

    let hasCityPins = false;
    for (const city of country.cities) {
      const cc = lookupCityCenter(city);
      const lat = city.latitude || cc?.lat;
      const lng = city.longitude || cc?.lng;
      if (lat && lng) {
        hasCityPins = true;
        pins.push({
          id: `city-${city.id}`,
          name: city.name,
          type: 'city',
          countryName: country.name,
          isVisited: city.visited,
          lat,
          lng,
        });
      }
    }

    if (!hasCityPins) {
      const cSlug = country.name.toLowerCase().replace(/\s+/g, '-');
      const center = COUNTRY_CENTERS[country.id] || COUNTRY_CENTERS[cSlug] || COUNTRY_CENTERS[country.code];
      if (center) {
        pins.push({
          id: `country-${country.id}`,
          name: country.name,
          type: 'country',
          isVisited: countryVisited,
          lat: center.lat,
          lng: center.lng,
        });
      }
    }
  }
  return pins;
}

export default function HomeMap({ countries }) {
  const pins = useMemo(() => buildPins(countries), [countries]);
  const { beenTo, planTo } = useMemo(() => classifyData(countries), [countries]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return (
    <div className="home-map-section">
      <div className="home-map-container">
        <MapContainer
          center={isMobile ? [20, 20] : [20, 40]}
          zoom={isMobile ? 1 : 2}
          scrollWheelZoom={true}
          dragging={true}
          style={{ width: '100%', height: '100%', borderRadius: '8px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={pin.isVisited ? visitedIcon : plannedIcon}
            >
              <Popup>
                <strong>{pin.name}</strong>
                {pin.countryName && <><br /><span style={{ fontSize: '0.78em', color: '#666' }}>{pin.countryName}</span></>}
                <br />
                <span style={{ fontSize: '0.75em', color: pin.isVisited ? '#0d7377' : '#4b5563' }}>
                  {pin.isVisited ? 'Visited' : 'Planned'}
                </span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="home-map-legend">
        <span className="home-map-legend-item">
          <span className="legend-dot legend-visited" /> Been here
        </span>
        <span className="home-map-legend-item">
          <span className="legend-dot legend-planned" /> Plan to visit
        </span>
      </div>

      {(beenTo.length > 0 || planTo.length > 0) && (
        <div className="home-map-summary">
          <div className="home-map-summary-col">
            <h4><FiCheckCircle size={14} /> Been to</h4>
            {beenTo.length === 0 && <p className="home-map-empty">No visited places yet</p>}
            {beenTo.map((c) => {
              const flagSrc = getFlagUrl(c.code || c.id, 24);
              return (
                <div key={`been-${c.id}`} className="home-map-summary-item">
                  <div className="home-map-summary-country-row">
                    {flagSrc && <img src={flagSrc} alt="" className="home-map-flag" loading="lazy" />}
                    <span className="home-map-summary-country">{c.name}</span>
                    {(c.trips || 0) > 0 && (
                      <span className="home-map-trips">{c.trips} trip{c.trips !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {c.filteredCities.length > 0 && (
                    <span className="home-map-summary-cities">
                      {c.filteredCities.map((ci) => ci.name).join(', ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="home-map-summary-col">
            <h4><FiCompass size={14} /> Plan to visit</h4>
            {planTo.length === 0 && <p className="home-map-empty">All places visited!</p>}
            {planTo.map((c) => {
              const flagSrc = getFlagUrl(c.code || c.id, 24);
              return (
                <div key={`plan-${c.id}`} className="home-map-summary-item">
                  <div className="home-map-summary-country-row">
                    {flagSrc && <img src={flagSrc} alt="" className="home-map-flag" loading="lazy" />}
                    <span className="home-map-summary-country">{c.name}</span>
                  </div>
                  {c.filteredCities.length > 0 && (
                    <span className="home-map-summary-cities">
                      {c.filteredCities.map((ci) => ci.name).join(', ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
