import { useState, useMemo, useRef, useEffect } from 'react';
import { FiChevronDown, FiX, FiArrowRight, FiPlus, FiNavigation, FiStar } from 'react-icons/fi';
import airports, { haversineDistance } from '../data/airports.js';

const OPERATING_AIRLINES = [
  { id: 'alaska', label: 'Alaska Airlines' },
  { id: 'hawaiian', label: 'Hawaiian Airlines' },
  { id: 'american', label: 'American Airlines' },
  { id: 'british', label: 'British Airways' },
  { id: 'cathay', label: 'Cathay Pacific' },
  { id: 'finnair', label: 'Finnair' },
  { id: 'iberia', label: 'Iberia' },
  { id: 'japan', label: 'Japan Airlines' },
  { id: 'malaysia', label: 'Malaysia Airlines' },
  { id: 'oman', label: 'Oman Air' },
  { id: 'qantas', label: 'Qantas' },
  { id: 'qatar', label: 'Qatar Airways' },
  { id: 'royal_air_maroc', label: 'Royal Air Maroc' },
  { id: 'royal_jordanian', label: 'Royal Jordanian' },
  { id: 'sri_lankan', label: 'SriLankan Airlines' },
  { id: 'starlux', label: 'Starlux Airlines' },
];

const BOOKED_THROUGH = [
  { id: 'alaska_portal', label: 'Alaska portal (alaskaair.com)' },
  { id: 'hawaiian_portal', label: 'Hawaiian portal (hawaiianairlines.com)' },
  { id: 'partner_portal', label: 'Other oneworld airline portal' },
];

const TRIP_TYPES = [
  { id: 'one_way', label: 'One-way', multiplier: 1 },
  { id: 'round_trip', label: 'Round trip', multiplier: 2 },
];

const FARE_CLASSES_ALASKA = [
  { id: 'J', label: 'J - First', base: 100, bonus: 100, status: 200 },
  { id: 'C', label: 'C - First', base: 100, bonus: 75, status: 175 },
  { id: 'D', label: 'D / I - First', base: 100, bonus: 50, status: 150 },
  { id: 'Y', label: 'Y / B - Economy', base: 100, bonus: 50, status: 150 },
  { id: 'H', label: 'H / K - Economy', base: 100, bonus: 25, status: 125 },
  { id: 'M', label: 'M / L / V / S / N / Q / O / G - Economy', base: 100, bonus: 0, status: 100 },
  { id: 'X', label: 'X - Saver Economy', base: 30, bonus: 0, status: 30 },
];

const FARE_CLASSES_HAWAIIAN = [
  { id: 'F', label: 'F / J - Domestic First / Intl Business', base: 100, bonus: 100, status: 200 },
  { id: 'P', label: 'P - Domestic First / Intl Business', base: 100, bonus: 75, status: 175 },
  { id: 'C', label: 'C / A / D - Domestic First / Intl Business', base: 100, bonus: 50, status: 150 },
  { id: 'Y', label: 'Y / W / X - Economy', base: 100, bonus: 50, status: 150 },
  { id: 'Q', label: 'Q / V / B / S - Economy', base: 100, bonus: 25, status: 125 },
  { id: 'N', label: 'N / M / I / H / G / K / L / Z / O - Economy', base: 100, bonus: 0, status: 100 },
  { id: 'U', label: 'U - Saver Economy', base: 30, bonus: 0, status: 30 },
];

const CABIN_PARTNER_ALASKA = [
  { id: 'intl_first', label: 'International First', base: 100, bonus: 250, status: 350 },
  { id: 'intl_biz', label: 'International Business', base: 100, bonus: 150, status: 250 },
  { id: 'dom_first', label: 'Domestic First', base: 100, bonus: 50, status: 150 },
  { id: 'prem_econ', label: 'Premium Economy', base: 100, bonus: 50, status: 150 },
  { id: 'economy', label: 'Economy', base: 100, bonus: 0, status: 100 },
  { id: 'disc_econ', label: 'Discount Economy', base: 100, bonus: 0, status: 100 },
];

const CABIN_PARTNER_SITE = [
  { id: 'first', label: 'First', base: 100, bonus: 50, status: 150 },
  { id: 'business', label: 'Business', base: 100, bonus: 25, status: 125 },
  { id: 'prem_econ', label: 'Premium Economy', base: 100, bonus: 0, status: 100 },
  { id: 'economy', label: 'Economy', base: 50, bonus: 0, status: 50 },
  { id: 'disc_econ', label: 'Discount Economy', base: 25, bonus: 0, status: 25 },
];

const STATUS_TIERS = [
  { id: 'none', label: 'No Status', bonus: 0 },
  { id: 'silver', label: 'Atmos Silver', bonus: 25 },
  { id: 'gold', label: 'Atmos Gold', bonus: 50 },
  { id: 'platinum', label: 'Atmos Platinum', bonus: 100 },
  { id: 'titanium', label: 'Atmos Titanium', bonus: 150 },
];

const AIRLINE_NETWORKS = {
  alaska: new Set(['SEA', 'ANC', 'PDX', 'SFO', 'LAX', 'SAN', 'SJC', 'OAK', 'SMF', 'ONT', 'SNA', 'BUR', 'PSP', 'FAI', 'JNU', 'KTN', 'SIT', 'BET', 'ADQ', 'HNL', 'OGG', 'KOA', 'LIH', 'JFK', 'EWR', 'BOS', 'DCA', 'IAD', 'PHL', 'ORD', 'ATL', 'DFW', 'IAH', 'AUS', 'DEN', 'PHX', 'LAS', 'MSP', 'DTW', 'MCO', 'MIA', 'FLL', 'TPA', 'BNA', 'SJD', 'PVR', 'CUN', 'MEX', 'YVR', 'YYC', 'NRT', 'HND', 'ICN', 'LHR', 'CDG', 'FRA', 'SIN', 'HKG', 'SYD', 'AKL', 'DOH', 'BKK']),
  hawaiian: new Set(['HNL', 'OGG', 'KOA', 'LIH', 'ITO', 'SEA', 'PDX', 'SFO', 'LAX', 'SAN', 'SJC', 'OAK', 'SMF', 'LAS', 'PHX', 'JFK', 'BOS', 'ICN', 'NRT', 'HND']),
  american: new Set(['JFK', 'LGA', 'EWR', 'BOS', 'PHL', 'CLT', 'DCA', 'IAD', 'MIA', 'ORD', 'DFW', 'AUS', 'LAX', 'SFO', 'SEA', 'SAN', 'PHX', 'LAS', 'DEN', 'LHR', 'CDG', 'FRA', 'BCN', 'FCO', 'DOH', 'NRT', 'HND', 'ICN', 'HKG']),
  british: new Set(['LHR', 'JFK', 'BOS', 'IAD', 'ORD', 'DFW', 'LAX', 'SFO', 'SEA', 'SAN', 'PHX', 'LAS', 'MIA', 'DOH', 'HKG', 'SIN', 'NRT']),
  cathay: new Set(['HKG', 'LAX', 'SFO', 'SEA', 'JFK', 'YVR', 'LHR', 'CDG', 'FRA', 'NRT', 'HND', 'ICN', 'SIN', 'BKK', 'MNL', 'TPE']),
  finnair: new Set(['LHR', 'JFK', 'LAX', 'SFO', 'ORD', 'DFW', 'NRT', 'HND', 'ICN', 'BKK', 'SIN']),
  iberia: new Set(['LHR', 'JFK', 'BOS', 'MIA', 'ORD', 'LAX', 'SFO', 'BCN', 'FCO', 'DOH']),
  japan: new Set(['NRT', 'HND', 'LAX', 'SFO', 'SEA', 'SAN', 'YVR', 'JFK', 'BOS', 'DFW', 'LHR', 'HKG', 'BKK', 'SIN', 'TPE']),
  malaysia: new Set(['LHR', 'NRT', 'HND', 'ICN', 'HKG', 'SIN', 'BKK', 'TPE', 'DOH']),
  oman: new Set(['DOH', 'LHR', 'BKK']),
  qantas: new Set(['SYD', 'AKL', 'LAX', 'SFO', 'DFW', 'NRT', 'HND', 'SIN', 'BKK', 'HKG', 'LHR']),
  qatar: new Set(['DOH', 'LAX', 'SFO', 'SEA', 'JFK', 'BOS', 'IAD', 'ORD', 'DFW', 'MIA', 'LHR', 'CDG', 'FRA', 'BCN', 'FCO', 'IST', 'HKG', 'BKK', 'SIN', 'MNL', 'TPE', 'DEL', 'BOM']),
  royal_air_maroc: new Set(['JFK', 'IAD', 'MIA', 'LHR', 'CDG', 'BCN']),
  royal_jordanian: new Set(['JFK', 'ORD', 'LHR', 'CDG', 'FCO', 'IST', 'DOH']),
  sri_lankan: new Set(['DOH', 'SIN', 'BKK', 'HKG', 'DEL', 'BOM', 'LHR']),
  starlux: new Set(['TPE', 'LAX', 'SFO', 'SEA', 'ONT', 'SAN', 'BKK', 'MNL']),
};

function getFareOptions(earningModel) {
  switch (earningModel) {
    case 'alaska': return FARE_CLASSES_ALASKA;
    case 'hawaiian': return FARE_CLASSES_HAWAIIAN;
    case 'partner_alaska': return CABIN_PARTNER_ALASKA;
    case 'partner_site': return CABIN_PARTNER_SITE;
    default: return [];
  }
}

function sortFareOptionsAscending(fareOptions) {
  return [...fareOptions].sort((a, b) => {
    const totalA = a.base + a.bonus;
    const totalB = b.base + b.bonus;
    if (totalA !== totalB) return totalA - totalB;
    if (a.status !== b.status) return a.status - b.status;
    return a.label.localeCompare(b.label);
  });
}

function getEarningModel(operatingAirline, bookedThrough) {
  const isAlaskaOrHawaiian = operatingAirline === 'alaska' || operatingAirline === 'hawaiian';
  if (isAlaskaOrHawaiian && bookedThrough === 'alaska_portal') return 'alaska';
  if (operatingAirline === 'hawaiian' && bookedThrough === 'hawaiian_portal') return 'hawaiian';
  if (!isAlaskaOrHawaiian && bookedThrough === 'alaska_portal') return 'partner_alaska';
  return 'partner_site';
}

function getEarningModelLabel(earningModel) {
  switch (earningModel) {
    case 'alaska':
      return 'Earning on Alaska/Hawaiian flights booked on alaskaair.com';
    case 'hawaiian':
      return 'Earning on Hawaiian flights booked on hawaiianairlines.com';
    case 'partner_alaska':
      return 'Earning on partner flights booked on Alaska';
    case 'partner_site':
      return 'Earning on partner flights booked via partner site';
    default:
      return '';
  }
}

function isAirlineAvailableForRoute(airlineId, origin, destination) {
  if (!origin || !destination) return true;
  const network = AIRLINE_NETWORKS[airlineId];
  if (!network) return true;
  return network.has(origin) && network.has(destination);
}

function AirportPicker({ value, onChange, label, excludeCodes, required }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return airports
      .filter((a) => !excludeCodes.includes(a.code) || a.code === value)
      .filter((a) => !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, excludeCodes, value]);

  const selected = airports.find((a) => a.code === value);

  return (
    <div className="pp-airport-picker pp-airport-picker--compact" ref={ref}>
      <label className="pp-label">
        {label}
        {required ? <span className="pp-required">*</span> : null}
      </label>
      <button
        type="button"
        className="pp-airport-btn"
        onClick={() => {
          setOpen(!open);
          setQuery('');
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        {selected ? (
          <span className="pp-airport-selected">
            <strong>{selected.code}</strong>
          </span>
        ) : (
          <span className="pp-airport-placeholder">Code</span>
        )}
        <FiChevronDown size={14} className={`pp-chevron ${open ? 'pp-chevron-open' : ''}`} />
      </button>
      {open && (
        <div className="pp-dropdown">
          <input
            ref={inputRef}
            className="pp-dropdown-search"
            placeholder="Search airport code, city, or name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="pp-dropdown-list">
            {filtered.map((a) => (
              <button
                type="button"
                key={a.code}
                className={`pp-dropdown-item ${a.code === value ? 'active' : ''}`}
                onClick={() => {
                  onChange(a.code);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <div className="pp-dropdown-primary">
                  <strong>{a.code}</strong>
                  <span className="pp-dropdown-name">{a.name}</span>
                </div>
                <span className="pp-dropdown-city">{a.city}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="pp-dropdown-empty">No airports found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Use SVG in public/ so dev + GitHub Pages builds resolve; replace with atmos.png if you add one. */
const ATMOS_LOGO_SRC = `${import.meta.env.BASE_URL}atmos.svg`;

export default function PointsPlanner() {
  const [routeAirports, setRouteAirports] = useState(['', '']);
  const [tripType, setTripType] = useState('');
  const [operatingAirline, setOperatingAirline] = useState('');
  const [bookedThrough, setBookedThrough] = useState('');
  const [fareClass, setFareClass] = useState('');
  const [status, setStatus] = useState('none');
  const [hasAtmosCard, setHasAtmosCard] = useState(false);
  const [hasBofA, setHasBofA] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');

  const origin = routeAirports[0] || '';
  const destination = routeAirports[routeAirports.length - 1] || '';
  const stopovers = routeAirports.slice(1, -1);
  const hasRouteEndpoints = Boolean(origin && destination);

  const airlineOptions = useMemo(
    () => OPERATING_AIRLINES.map((airline) => ({
      ...airline,
      available: !hasRouteEndpoints || isAirlineAvailableForRoute(airline.id, origin, destination),
    })),
    [hasRouteEndpoints, origin, destination]
  );

  const earningModel = useMemo(() => {
    if (!operatingAirline || !bookedThrough) return '';
    return getEarningModel(operatingAirline, bookedThrough);
  }, [operatingAirline, bookedThrough]);

  const fareOptions = useMemo(() => sortFareOptionsAscending(getFareOptions(earningModel)), [earningModel]);
  const tripMultiplier = TRIP_TYPES.find((t) => t.id === tripType)?.multiplier || 1;
  const missingRouteAirport = routeAirports.some((code) => !code);

  useEffect(() => {
    if (fareClass && !fareOptions.some((f) => f.id === fareClass)) {
      setFareClass('');
    }
  }, [fareOptions, fareClass]);

  useEffect(() => {
    if (operatingAirline && hasRouteEndpoints && !isAirlineAvailableForRoute(operatingAirline, origin, destination)) {
      setOperatingAirline('');
    }
  }, [operatingAirline, hasRouteEndpoints, origin, destination]);

  const segmentMiles = useMemo(() => {
    if (missingRouteAirport) return [];
    const segments = [];
    for (let i = 0; i < routeAirports.length - 1; i += 1) {
      const fromCode = routeAirports[i];
      const toCode = routeAirports[i + 1];
      const fromAirport = airports.find((a) => a.code === fromCode);
      const toAirport = airports.find((a) => a.code === toCode);
      if (!fromAirport || !toAirport) return [];
      segments.push({
        fromCode,
        toCode,
        miles: Math.round(haversineDistance(fromAirport.lat, fromAirport.lon, toAirport.lat, toAirport.lon)),
      });
    }
    return segments;
  }, [routeAirports, missingRouteAirport]);

  const oneWayDistance = useMemo(() => segmentMiles.reduce((sum, segment) => sum + segment.miles, 0), [segmentMiles]);
  const totalFlownDistance = oneWayDistance * tripMultiplier;
  const requiredComplete = Boolean(origin && destination && tripType && operatingAirline && bookedThrough && fareClass);

  const results = useMemo(() => {
    if (!requiredComplete || totalFlownDistance === 0) return null;
    const fare = fareOptions.find((f) => f.id === fareClass);
    if (!fare) return null;

    const tier = STATUS_TIERS.find((t) => t.id === status);
    const statusBonusPct = tier ? tier.bonus : 0;

    const baseMiles = Math.round(totalFlownDistance * (fare.base / 100));
    const cabinBonusMiles = Math.round(totalFlownDistance * (fare.bonus / 100));
    const eliteBonusMiles = Math.round(totalFlownDistance * (statusBonusPct / 100));
    const flightMiles = baseMiles + cabinBonusMiles + eliteBonusMiles;
    const statusPoints = Math.round(totalFlownDistance * (fare.status / 100));

    const price = parseFloat(ticketPrice) || 0;
    let cardMiles = 0;
    let cardStatusPts = 0;
    if (hasAtmosCard && price > 0) {
      const isAlaskaOrHawaiianPortal = bookedThrough === 'alaska_portal' || bookedThrough === 'hawaiian_portal';
      cardMiles = Math.round(price * (isAlaskaOrHawaiianPortal ? 3 : 1));
      cardStatusPts = Math.round(price / 2);
    }
    const bofABonusMiles = hasBofA && hasAtmosCard ? Math.round(cardMiles * 0.1) : 0;

    return {
      routeCodes: routeAirports,
      oneWayDistance,
      totalFlownDistance,
      tripMultiplier,
      tripTypeLabel: TRIP_TYPES.find((t) => t.id === tripType)?.label || 'One-way',
      earningModelLabel: getEarningModelLabel(earningModel),
      basePct: fare.base,
      cabinBonusPct: fare.bonus,
      statusPct: fare.status,
      effectiveMilesPct: fare.base + fare.bonus + statusBonusPct,
      baseMiles,
      cabinBonusMiles,
      statusBonusPct,
      eliteBonusMiles,
      flightMiles,
      statusPoints,
      cardMiles,
      cardStatusPts,
      bofAApplied: hasBofA && hasAtmosCard,
      bofABonusMiles,
      totalMiles: flightMiles + cardMiles + bofABonusMiles,
      totalStatusPts: statusPoints + cardStatusPts,
    };
  }, [requiredComplete, totalFlownDistance, fareOptions, fareClass, status, hasAtmosCard, ticketPrice, bookedThrough, hasBofA, routeAirports, tripMultiplier, tripType, earningModel]);

  function setOrigin(code) {
    setRouteAirports((prev) => {
      const next = [...prev];
      next[0] = code;
      return next;
    });
  }

  function setDestination(code) {
    setRouteAirports((prev) => {
      const next = [...prev];
      next[next.length - 1] = code;
      return next;
    });
  }

  function updateStopover(index, code) {
    setRouteAirports((prev) => prev.map((item, i) => (i === index + 1 ? code : item)));
  }

  function addStopover() {
    setRouteAirports((prev) => {
      const next = [...prev];
      next.splice(next.length - 1, 0, '');
      return next;
    });
  }

  function removeStopover(index) {
    setRouteAirports((prev) => prev.filter((_, i) => i !== index + 1));
  }

  return (
    <div className="pp-page">
      <nav className="pp-nav">
        <span className="pp-nav-title">Atmos Rewards Points Planner</span>
      </nav>

      <div className="pp-container">
        <div className="pp-hero">
          <img src={ATMOS_LOGO_SRC} alt="" className="pp-atmos-logo" />
          <h1 className="pp-hero-heading">Atmos Rewards Points Planner</h1>
          <p className="pp-hero-sub">Plan Atmos reward miles and status points with nonstop or multi-stop routes.</p>
        </div>

        <div className="pp-grid">
          <div className="pp-card pp-form-card">
            <h2 className="pp-card-title">Route & Fare</h2>

            <div className="pp-airport-row">
              <div className="pp-airport-seg">
                <AirportPicker
                  label="Origin"
                  required
                  value={origin}
                  onChange={setOrigin}
                  excludeCodes={routeAirports.filter((code, idx) => idx !== 0 && code)}
                />
              </div>
              <span className="pp-route-arrow" aria-hidden><FiArrowRight size={16} /></span>
              {stopovers.map((code, index) => (
                <div key={`stop-wrap-${index}`} className="pp-stopover-inline">
                  <div className="pp-airport-seg">
                    <AirportPicker
                      label={`Stop ${index + 1}`}
                      value={code}
                      onChange={(nextCode) => updateStopover(index, nextCode)}
                      excludeCodes={routeAirports.filter((airportCode, i) => i !== index + 1 && airportCode)}
                    />
                  </div>
                  <button type="button" className="pp-stop-remove" onClick={() => removeStopover(index)} aria-label={`Remove stop ${index + 1}`}>
                    <FiX size={14} />
                  </button>
                  <span className="pp-route-arrow" aria-hidden><FiArrowRight size={16} /></span>
                </div>
              ))}
              <button type="button" className="pp-add-stop" onClick={addStopover} title="Add stopover">
                <FiPlus size={16} />
              </button>
              <span className="pp-route-arrow" aria-hidden><FiArrowRight size={16} /></span>
              <div className="pp-airport-seg">
                <AirportPicker
                  label="Destination"
                  required
                  value={destination}
                  onChange={setDestination}
                  excludeCodes={routeAirports.filter((code, idx) => idx !== routeAirports.length - 1 && code)}
                />
              </div>
            </div>

            {oneWayDistance > 0 && (
              <div className="pp-distance">
                <span>{oneWayDistance.toLocaleString()} miles one-way</span>
                {tripMultiplier > 1 ? ` · ${totalFlownDistance.toLocaleString()} miles total flown` : ''}
              </div>
            )}

            <div className="pp-field">
              <label className="pp-label">Trip type<span className="pp-required">*</span></label>
              <select className="pp-select" value={tripType} onChange={(e) => setTripType(e.target.value)}>
                <option value="">Select trip type...</option>
                {TRIP_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </div>

            <div className="pp-field">
              <label className="pp-label">Airline (operating carrier)<span className="pp-required">*</span></label>
              <select className="pp-select" value={operatingAirline} onChange={(e) => setOperatingAirline(e.target.value)}>
                <option value="">Select operating carrier...</option>
                {airlineOptions.map((airline) => (
                  <option key={airline.id} value={airline.id} disabled={!airline.available}>
                    {airline.label}{!airline.available ? ' (not available for selected route)' : ''}
                  </option>
                ))}
              </select>
              {hasRouteEndpoints && (
                <span className="pp-hint">Airlines unavailable for the selected origin/destination are disabled.</span>
              )}
            </div>

            <div className="pp-field">
              <label className="pp-label">Airline booked through<span className="pp-required">*</span></label>
              <select className="pp-select" value={bookedThrough} onChange={(e) => setBookedThrough(e.target.value)}>
                <option value="">Select booking portal...</option>
                {BOOKED_THROUGH.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
              </select>
              <span className="pp-hint">{earningModel ? getEarningModelLabel(earningModel) : 'Select airline + booking portal to determine earning table.'}</span>
            </div>

            <div className="pp-field">
              <label className="pp-label">Fare class / cabin<span className="pp-required">*</span></label>
              <select className="pp-select" value={fareClass} onChange={(e) => setFareClass(e.target.value)} disabled={!earningModel}>
                <option value="">Select fare class...</option>
                {fareOptions.map((fare) => <option key={fare.id} value={fare.id}>{fare.label}</option>)}
              </select>
            </div>

            <h2 className="pp-card-title pp-section-gap">Bonuses & Status</h2>

            <div className="pp-field">
              <label className="pp-label">Atmos status</label>
              <select className="pp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_TIERS.map((tier) => <option key={tier.id} value={tier.id}>{tier.label}{tier.bonus > 0 ? ` (+${tier.bonus}% miles)` : ''}</option>)}
              </select>
            </div>

            <div className="pp-checks">
              <label className="pp-check">
                <input type="checkbox" checked={hasAtmosCard} onChange={(e) => setHasAtmosCard(e.target.checked)} />
                <span>Atmos Summit credit card</span>
              </label>
              <label className="pp-check">
                <input type="checkbox" checked={hasBofA} onChange={(e) => setHasBofA(e.target.checked)} />
                <span>Bank of America relationship (+10% card miles)</span>
              </label>
            </div>

            {hasAtmosCard && (
              <div className="pp-field">
                <label className="pp-label">Ticket price ($)</label>
                <input className="pp-input" type="number" min="0" step="0.01" placeholder="e.g. 1200" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} />
                <span className="pp-hint">Card earning: 3x miles on Alaska/Hawaiian portals, 1x on other portals. Status points from card spend are 1 per $2.</span>
              </div>
            )}
          </div>

          <div className="pp-card pp-results-card">
            <h2 className="pp-card-title">Estimated Earnings</h2>
            {results ? (
              <>
                <div className="pp-result-hero">
                  <div className="pp-result-big">
                    <span className="pp-result-icon"><FiNavigation size={16} /></span>
                    <span className="pp-result-num">{results.totalMiles.toLocaleString()}</span>
                    <span className="pp-result-label">Atmos Reward Miles</span>
                  </div>
                  <div className="pp-result-big pp-result-status">
                    <span className="pp-result-icon"><FiStar size={16} /></span>
                    <span className="pp-result-num">{results.totalStatusPts.toLocaleString()}</span>
                    <span className="pp-result-label">Status Points</span>
                  </div>
                </div>

                <div className="pp-breakdown">
                  <h3>Breakdown</h3>
                  <div className="pp-breakdown-row"><span>Route</span><span>{results.routeCodes.join(' -> ')}</span></div>
                  <div className="pp-breakdown-row"><span>Distance</span><span>{results.oneWayDistance.toLocaleString()} mi one-way × {results.tripMultiplier} ({results.tripTypeLabel.toLowerCase()})</span></div>
                  <div className="pp-breakdown-row"><span>Total flown miles</span><span>{results.totalFlownDistance.toLocaleString()} mi</span></div>
                  <div className="pp-breakdown-row"><span>Earning table used</span><span>{results.earningModelLabel}</span></div>
                  <div className="pp-breakdown-row"><span>Fare earning rate</span><span>{results.basePct}% base + {results.cabinBonusPct}% cabin</span></div>
                  <div className="pp-breakdown-row"><span>Effective miles earning rate</span><span>{results.effectiveMilesPct}%</span></div>
                  <div className="pp-breakdown-row"><span>Base flight miles</span><span>{results.baseMiles.toLocaleString()}</span></div>
                  <div className="pp-breakdown-row"><span>Cabin bonus miles</span><span>{results.cabinBonusMiles.toLocaleString()}</span></div>
                  {results.statusBonusPct > 0 && (
                    <div className="pp-breakdown-row pp-highlight"><span>Atmos status bonus (+{results.statusBonusPct}%)</span><span>+{results.eliteBonusMiles.toLocaleString()} mi</span></div>
                  )}
                  <div className="pp-breakdown-row"><span>Flight miles subtotal</span><span>{results.flightMiles.toLocaleString()}</span></div>
                  <div className="pp-breakdown-row"><span>Status points from flight</span><span>{results.statusPoints.toLocaleString()} ({results.statusPct}%)</span></div>
                  {results.cardMiles > 0 && (
                    <div className="pp-breakdown-row pp-highlight"><span>Atmos Summit card spend</span><span>+{results.cardMiles.toLocaleString()} mi / +{results.cardStatusPts.toLocaleString()} SP</span></div>
                  )}
                  {results.bofAApplied && (
                    <div className="pp-breakdown-row pp-highlight"><span>Bank of America bonus (10% of card miles)</span><span>+{results.bofABonusMiles.toLocaleString()} mi</span></div>
                  )}
                  <div className="pp-breakdown-total"><span>Total</span><span>{results.totalMiles.toLocaleString()} miles · {results.totalStatusPts.toLocaleString()} SP</span></div>
                </div>
              </>
            ) : (
              <div className="pp-empty">
                <p>Complete all required fields (marked *) to calculate Atmos rewards earnings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
