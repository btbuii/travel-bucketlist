import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiX, FiArrowRight, FiPlus } from 'react-icons/fi';
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
  { id: 'J', label: 'J — First', base: 100, bonus: 100, status: 200 },
  { id: 'C', label: 'C — First', base: 100, bonus: 75, status: 175 },
  { id: 'D', label: 'D / I — First', base: 100, bonus: 50, status: 150 },
  { id: 'Y', label: 'Y / B — Economy', base: 100, bonus: 50, status: 150 },
  { id: 'H', label: 'H / K — Economy', base: 100, bonus: 25, status: 125 },
  { id: 'M', label: 'M / L / V / S / N / Q / O / G — Economy', base: 100, bonus: 0, status: 100 },
  { id: 'X', label: 'X — Saver Economy', base: 30, bonus: 0, status: 30 },
];

const FARE_CLASSES_HAWAIIAN = [
  { id: 'F', label: 'F / J — Domestic First / Intl Business', base: 100, bonus: 100, status: 200 },
  { id: 'P', label: 'P — Domestic First / Intl Business', base: 100, bonus: 75, status: 175 },
  { id: 'C', label: 'C / A / D — Domestic First / Intl Business', base: 100, bonus: 50, status: 150 },
  { id: 'Y', label: 'Y / W / X — Economy', base: 100, bonus: 50, status: 150 },
  { id: 'Q', label: 'Q / V / B / S — Economy', base: 100, bonus: 25, status: 125 },
  { id: 'N', label: 'N / M / I / H / G / K / L / Z / O — Economy', base: 100, bonus: 0, status: 100 },
  { id: 'U', label: 'U — Saver Economy', base: 30, bonus: 0, status: 30 },
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

function getFareOptions(earningModel) {
  switch (earningModel) {
    case 'alaska': return FARE_CLASSES_ALASKA;
    case 'hawaiian': return FARE_CLASSES_HAWAIIAN;
    case 'partner_alaska': return CABIN_PARTNER_ALASKA;
    case 'partner_site': return CABIN_PARTNER_SITE;
    default: return [];
  }
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

function AirportPicker({ value, onChange, label, excludeCodes }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
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
    <div className="pp-airport-picker" ref={ref}>
      <label className="pp-label">{label}</label>
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
            <strong>{selected.code}</strong> - {selected.name}, {selected.city}
          </span>
        ) : (
          <span className="pp-airport-placeholder">Select airport...</span>
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

export default function PointsPlanner() {
  const [routeAirports, setRouteAirports] = useState(['', '']);
  const [tripType, setTripType] = useState('one_way');
  const [operatingAirline, setOperatingAirline] = useState('alaska');
  const [bookedThrough, setBookedThrough] = useState('alaska_portal');
  const [fareClass, setFareClass] = useState('');
  const [status, setStatus] = useState('none');
  const [hasAtmosCard, setHasAtmosCard] = useState(false);
  const [hasBofA, setHasBofA] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');

  const earningModel = useMemo(() => getEarningModel(operatingAirline, bookedThrough), [operatingAirline, bookedThrough]);
  const fareOptions = getFareOptions(earningModel);
  const tripMultiplier = TRIP_TYPES.find((t) => t.id === tripType)?.multiplier || 1;
  const missingRouteAirport = routeAirports.some((code) => !code);

  useEffect(() => {
    if (fareOptions.length > 0 && !fareOptions.find((f) => f.id === fareClass)) {
      setFareClass(fareOptions[0].id);
    }
  }, [fareOptions, fareClass]);

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
        key: `${fromCode}-${toCode}-${i}`,
        fromCode,
        toCode,
        miles: Math.round(haversineDistance(fromAirport.lat, fromAirport.lon, toAirport.lat, toAirport.lon)),
      });
    }
    return segments;
  }, [routeAirports, missingRouteAirport]);

  const oneWayDistance = useMemo(() => segmentMiles.reduce((sum, segment) => sum + segment.miles, 0), [segmentMiles]);
  const totalFlownDistance = oneWayDistance * tripMultiplier;

  const results = useMemo(() => {
    if (missingRouteAirport || !fareClass || totalFlownDistance === 0) return null;
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
      fareLabel: fare.label,
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
  }, [missingRouteAirport, fareClass, totalFlownDistance, fareOptions, status, hasAtmosCard, ticketPrice, bookedThrough, hasBofA, routeAirports, oneWayDistance, tripMultiplier, tripType, earningModel]);

  function updateRouteAirport(index, code) {
    setRouteAirports((prev) => prev.map((item, i) => (i === index ? code : item)));
  }

  function addStopover() {
    setRouteAirports((prev) => {
      const next = [...prev];
      next.splice(next.length - 1, 0, '');
      return next;
    });
  }

  function removeStopover(index) {
    if (index <= 0 || index >= routeAirports.length - 1) return;
    setRouteAirports((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="pp-page">
      <nav className="pp-nav">
        <Link to="/" className="pp-nav-brand">Travel Bucketlist</Link>
        <span className="pp-nav-title">Atmos Rewards Points Planner</span>
      </nav>

      <div className="pp-container">
        <div className="pp-hero">
          <div className="pp-hero-brand">
            <span className="pp-logo-badge">AS</span>
            <span className="pp-hero-brand-text">Alaska Airlines</span>
          </div>
          <h1>Atmos Rewards Points Planner</h1>
          <p>Calculate Atmos reward miles and status points for nonstop or multi-stop routes.</p>
        </div>

        <div className="pp-grid">
          <div className="pp-card pp-form-card">
            <h2 className="pp-card-title">Route & Fare</h2>

            <div className="pp-route-stack">
              {routeAirports.map((code, index) => {
                const isOrigin = index === 0;
                const isDestination = index === routeAirports.length - 1;
                const label = isOrigin ? 'Origin' : (isDestination ? 'Destination' : `Stopover ${index}`);
                return (
                  <div key={`route-${index}`} className="pp-route-stop">
                    <div className="pp-route-stop-row">
                      <AirportPicker
                        label={label}
                        value={code}
                        onChange={(nextCode) => updateRouteAirport(index, nextCode)}
                        excludeCodes={routeAirports.filter((airportCode, i) => i !== index && airportCode)}
                      />
                      {!isOrigin && !isDestination && (
                        <button type="button" className="pp-stop-remove" onClick={() => removeStopover(index)} aria-label={`Remove stopover ${index}`}>
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                    {!isDestination && <div className="pp-arrow-col pp-arrow-inline"><FiArrowRight size={16} /></div>}
                  </div>
                );
              })}

              <button type="button" className="pp-add-stop" onClick={addStopover}>
                <FiPlus size={14} />
                Add layover / stop airport
              </button>
            </div>

            {oneWayDistance > 0 && (
              <div className="pp-distance">
                <span>{oneWayDistance.toLocaleString()} miles one-way</span>
                {tripMultiplier > 1 ? ` · ${totalFlownDistance.toLocaleString()} miles total flown` : ''}
              </div>
            )}

            <div className="pp-field">
              <label className="pp-label">Trip type</label>
              <select className="pp-select" value={tripType} onChange={(e) => setTripType(e.target.value)}>
                {TRIP_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </div>

            <div className="pp-field">
              <label className="pp-label">Airline (operating carrier)</label>
              <select className="pp-select" value={operatingAirline} onChange={(e) => setOperatingAirline(e.target.value)}>
                {OPERATING_AIRLINES.map((airline) => <option key={airline.id} value={airline.id}>{airline.label}</option>)}
              </select>
            </div>

            <div className="pp-field">
              <label className="pp-label">Airline booked through</label>
              <select className="pp-select" value={bookedThrough} onChange={(e) => setBookedThrough(e.target.value)}>
                {BOOKED_THROUGH.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
              </select>
              <span className="pp-hint">{getEarningModelLabel(earningModel)}</span>
            </div>

            <div className="pp-field">
              <label className="pp-label">Fare class / cabin</label>
              <select className="pp-select" value={fareClass} onChange={(e) => setFareClass(e.target.value)}>
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
                    <span className="pp-result-num">{results.totalMiles.toLocaleString()}</span>
                    <span className="pp-result-label">Atmos Reward Miles</span>
                  </div>
                  <div className="pp-result-big pp-result-status">
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
                <p>Select all route airports and a fare class to see your estimated Atmos rewards earnings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
