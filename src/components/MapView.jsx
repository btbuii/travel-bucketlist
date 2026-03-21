import { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTRY_CENTERS, CITY_CENTERS } from '../data/coordinates';

function makeSvgIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="33" viewBox="0 0 20 33">
    <path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 23 10 23s10-15.5 10-23C20 4.5 15.5 0 10 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="10" cy="10" r="4" fill="#fff"/>
  </svg>`;
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
    iconSize: [20, 33],
    iconAnchor: [10, 33],
    popupAnchor: [0, -33],
  });
}

const visitedIcon = makeSvgIcon('#0d7377');
const bucketIcon = makeSvgIcon('#9ca3af');

function MapController({ pins, cityId, countryId, cityName, countryName }) {
  const map = useMap();
  const prevNavRef = useRef('');
  const prevPinIdsRef = useRef('');

  useEffect(() => {
    const navKey = `${cityId}|${countryId}`;

    if (navKey !== prevNavRef.current) {
      prevNavRef.current = navKey;
      if (cityId && cityId !== 'all') {
        const slug = cityName ? cityName.toLowerCase().replace(/\s+/g, '-') : '';
        const cc = CITY_CENTERS[cityId] || CITY_CENTERS[slug];
        if (cc) { map.flyTo([cc.lat, cc.lng], 12, { duration: 0.8 }); return; }
      }
      if (countryId) {
        const cSlug = countryName ? countryName.toLowerCase() : '';
        const cc = COUNTRY_CENTERS[countryId] || COUNTRY_CENTERS[cSlug];
        if (cc) { map.flyTo([cc.lat, cc.lng], cc.zoom, { duration: 0.8 }); return; }
      }
      return;
    }

    const pinIds = pins.map((p) => p.id).sort().join(',');
    if (pinIds !== prevPinIdsRef.current && pins.length > 0) {
      prevPinIdsRef.current = pinIds;
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15, animate: true, duration: 0.5 });
    } else {
      prevPinIdsRef.current = pinIds;
    }
  }, [pins, cityId, countryId, cityName, countryName, map]);

  return null;
}

export default function MapView({ entries, countryId, cityId, cityName, countryName }) {
  const pins = useMemo(() =>
    entries.filter((e) => e.latitude && e.longitude).map((e) => ({
      id: e.id,
      name: e.name,
      address: e.address,
      lat: e.latitude,
      lng: e.longitude,
      city: e._city || '',
      status: e.status || 'bucket-list',
      tags: e.tags || [],
    })),
    [entries]
  );

  const { center, zoom } = useMemo(() => {
    if (pins.length > 0) {
      const avgLat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
      const avgLng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;
      return { center: { lat: avgLat, lng: avgLng }, zoom: pins.length === 1 ? 14 : 11 };
    }
    if (cityId && cityId !== 'all') {
      const slug = cityName ? cityName.toLowerCase().replace(/\s+/g, '-') : '';
      const cc = CITY_CENTERS[cityId] || CITY_CENTERS[slug];
      if (cc) return { center: cc, zoom: 12 };
    }
    if (countryId) {
      const cSlug = countryName ? countryName.toLowerCase() : '';
      const cc = COUNTRY_CENTERS[countryId] || COUNTRY_CENTERS[cSlug];
      if (cc) return { center: { lat: cc.lat, lng: cc.lng }, zoom: cc.zoom };
    }
    return { center: { lat: 20, lng: 100 }, zoom: 3 };
  }, [pins, cityId, countryId, cityName, countryName]);

  return (
    <div className="map-container">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        dragging={true}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController pins={pins} cityId={cityId} countryId={countryId} cityName={cityName} countryName={countryName} />
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={pin.status === 'visited' ? visitedIcon : bucketIcon}>
            <Tooltip direction="top" offset={[0, -34]} className="map-entry-tooltip">
              <strong>{pin.name}</strong>
              {pin.tags.length > 0 && (
                <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {pin.tags.slice(0, 3).map((tag) => (
                    <span key={tag} style={{
                      display: 'inline-block',
                      padding: '0 4px',
                      borderRadius: 3,
                      fontSize: '0.7em',
                      fontWeight: 500,
                      background: pin.status === 'visited' ? 'rgba(13,115,119,0.12)' : 'rgba(0,0,0,0.06)',
                      color: pin.status === 'visited' ? '#0d7377' : '#71717a',
                    }}>{tag}</span>
                  ))}
                  {pin.tags.length > 3 && <span style={{ fontSize: '0.65em', color: '#999' }}>+{pin.tags.length - 3}</span>}
                </div>
              )}
            </Tooltip>
            <Popup>
              <strong>{pin.name}</strong>
              {pin.address && <br />}
              {pin.address && <span style={{ fontSize: '0.8em', color: '#666' }}>{pin.address}</span>}
              {pin.city && <br />}
              {pin.city && <span style={{ fontSize: '0.75em', color: '#999' }}>{pin.city}</span>}
              {pin.tags.length > 0 && (
                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {pin.tags.map((tag) => (
                    <span key={tag} style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: '0.7em',
                      fontWeight: 500,
                      background: pin.status === 'visited' ? 'rgba(13,115,119,0.1)' : 'rgba(0,0,0,0.06)',
                      color: pin.status === 'visited' ? '#0d7377' : '#71717a',
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
