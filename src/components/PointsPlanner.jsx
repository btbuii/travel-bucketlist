import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiX, FiArrowRight } from 'react-icons/fi';
import airports, { haversineDistance } from '../data/airports.js';

const BOOKING_SOURCES = [
  { id: 'alaska', label: 'Alaska / Hawaiian (booked on alaskaair.com)' },
  { id: 'hawaiian', label: 'Hawaiian (booked on hawaiianairlines.com)' },
  { id: 'partner_alaska', label: 'Partner airline (booked on Alaska)' },
  { id: 'partner_site', label: 'Partner airline (booked via partner site)' },
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
  { id: 'silver', label: 'MVP (Silver)', bonus: 25 },
  { id: 'gold', label: 'MVP Gold', bonus: 50 },
  { id: 'platinum', label: 'MVP Gold 75K (Platinum)', bonus: 100 },
  { id: 'titanium', label: 'MVP Gold 100K (Titanium)', bonus: 150 },
];

function getFareOptions(bookingSource) {
  switch (bookingSource) {
    case 'alaska': return FARE_CLASSES_ALASKA;
    case 'hawaiian': return FARE_CLASSES_HAWAIIAN;
    case 'partner_alaska': return CABIN_PARTNER_ALASKA;
    case 'partner_site': return CABIN_PARTNER_SITE;
    default: return [];
  }
}

function AirportPicker({ value, onChange, label, excludeCode }) {
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
      .filter(a => a.code !== excludeCode)
      .filter(a => !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, excludeCode]);

  const selected = airports.find(a => a.code === value);

  return (
    <div className="pp-airport-picker" ref={ref}>
      <label className="pp-label">{label}</label>
      <button className="pp-airport-btn" onClick={() => { setOpen(!open); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }}>
        {selected ? (
          <span className="pp-airport-selected">
            <strong>{selected.code}</strong> — {selected.city}
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
            placeholder="Search airport code or city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="pp-dropdown-list">
            {filtered.map(a => (
              <button key={a.code} className={`pp-dropdown-item ${a.code === value ? 'active' : ''}`}
                onClick={() => { onChange(a.code); setOpen(false); setQuery(''); }}>
                <strong>{a.code}</strong>
                <span>{a.name}</span>
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
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [bookingSource, setBookingSource] = useState('alaska');
  const [fareClass, setFareClass] = useState('');
  const [status, setStatus] = useState('none');
  const [hasAtmosCard, setHasAtmosCard] = useState(false);
  const [hasBofA, setHasBofA] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');

  const fareOptions = getFareOptions(bookingSource);

  useEffect(() => {
    if (fareOptions.length > 0 && !fareOptions.find(f => f.id === fareClass)) {
      setFareClass(fareOptions[0].id);
    }
  }, [bookingSource, fareOptions, fareClass]);

  const distance = useMemo(() => {
    const o = airports.find(a => a.code === origin);
    const d = airports.find(a => a.code === dest);
    if (!o || !d) return 0;
    return Math.round(haversineDistance(o.lat, o.lon, d.lat, d.lon));
  }, [origin, dest]);

  const results = useMemo(() => {
    if (!origin || !dest || !fareClass || distance === 0) return null;
    const fare = fareOptions.find(f => f.id === fareClass);
    if (!fare) return null;

    const totalPct = fare.base + fare.bonus;
    const statusPct = fare.status;
    const baseMiles = Math.round(distance * (totalPct / 100));
    const baseStatusPts = Math.round(distance * (statusPct / 100));

    const tier = STATUS_TIERS.find(t => t.id === status);
    const statusBonus = tier ? tier.bonus : 0;
    const milesAfterStatus = Math.round(baseMiles * (1 + statusBonus / 100));
    const statusPtsAfterStatus = Math.round(baseStatusPts * (1 + statusBonus / 100));

    const milesAfterBofA = hasBofA ? Math.round(milesAfterStatus * 1.10) : milesAfterStatus;

    const price = parseFloat(ticketPrice) || 0;
    let cardMiles = 0;
    let cardStatusPts = 0;
    if (hasAtmosCard && price > 0) {
      const isAlaskaBooking = bookingSource === 'alaska' || bookingSource === 'hawaiian';
      cardMiles = Math.round(price * (isAlaskaBooking ? 3 : 1));
      cardStatusPts = Math.round(price / 2);
    }

    return {
      distance,
      fareLabel: fare.label,
      totalPct,
      statusPct,
      baseMiles,
      baseStatusPts,
      statusBonusPct: statusBonus,
      milesAfterStatus,
      statusPtsAfterStatus,
      bofAApplied: hasBofA,
      milesAfterBofA,
      cardMiles,
      cardStatusPts,
      totalMiles: milesAfterBofA + cardMiles,
      totalStatusPts: statusPtsAfterStatus + cardStatusPts,
    };
  }, [origin, dest, fareClass, distance, fareOptions, status, hasBofA, hasAtmosCard, ticketPrice, bookingSource]);

  return (
    <div className="pp-page">
      <nav className="pp-nav">
        <Link to="/" className="pp-nav-brand">Travel Bucketlist</Link>
        <span className="pp-nav-title">Alaska Atmos Points Planner</span>
      </nav>

      <div className="pp-container">
        <div className="pp-hero">
          <h1>Mileage Plan Points Calculator</h1>
          <p>Calculate your Alaska Airlines Atmos miles and status points for any route.</p>
        </div>

        <div className="pp-grid">
          <div className="pp-card pp-form-card">
            <h2 className="pp-card-title">Route & Fare</h2>

            <div className="pp-airport-row">
              <AirportPicker label="Origin" value={origin} onChange={setOrigin} excludeCode={dest} />
              <div className="pp-arrow-col"><FiArrowRight size={18} /></div>
              <AirportPicker label="Destination" value={dest} onChange={setDest} excludeCode={origin} />
            </div>

            {distance > 0 && (
              <div className="pp-distance">
                <span>{distance.toLocaleString()} miles</span> between airports
              </div>
            )}

            <div className="pp-field">
              <label className="pp-label">Booked through</label>
              <select className="pp-select" value={bookingSource} onChange={(e) => setBookingSource(e.target.value)}>
                {BOOKING_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div className="pp-field">
              <label className="pp-label">Fare class / cabin</label>
              <select className="pp-select" value={fareClass} onChange={(e) => setFareClass(e.target.value)}>
                {fareOptions.map(f => <option key={f.id} value={f.id}>{f.label} — {f.base + f.bonus}% miles</option>)}
              </select>
            </div>

            <h2 className="pp-card-title pp-section-gap">Bonuses & Status</h2>

            <div className="pp-field">
              <label className="pp-label">Elite status</label>
              <select className="pp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}{t.bonus > 0 ? ` (+${t.bonus}%)` : ''}</option>)}
              </select>
            </div>

            <div className="pp-checks">
              <label className="pp-check">
                <input type="checkbox" checked={hasAtmosCard} onChange={(e) => setHasAtmosCard(e.target.checked)} />
                <span>Atmos Summit credit card</span>
              </label>
              <label className="pp-check">
                <input type="checkbox" checked={hasBofA} onChange={(e) => setHasBofA(e.target.checked)} />
                <span>Bank of America account (+10%)</span>
              </label>
            </div>

            {hasAtmosCard && (
              <div className="pp-field">
                <label className="pp-label">Ticket price ($)</label>
                <input className="pp-input" type="number" min="0" step="0.01" placeholder="e.g. 350" value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)} />
                <span className="pp-hint">For Atmos card earning: 3x miles on Alaska bookings, 1x on others. 1 status point per $2 spent.</span>
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
                    <span className="pp-result-label">Mileage Plan Miles</span>
                  </div>
                  <div className="pp-result-big pp-result-status">
                    <span className="pp-result-num">{results.totalStatusPts.toLocaleString()}</span>
                    <span className="pp-result-label">Status Points</span>
                  </div>
                </div>

                <div className="pp-breakdown">
                  <h3>Breakdown</h3>
                  <div className="pp-breakdown-row">
                    <span>Route distance</span>
                    <span>{results.distance.toLocaleString()} mi</span>
                  </div>
                  <div className="pp-breakdown-row">
                    <span>Fare earning rate</span>
                    <span>{results.totalPct}% miles / {results.statusPct}% status</span>
                  </div>
                  <div className="pp-breakdown-row">
                    <span>Base miles earned</span>
                    <span>{results.baseMiles.toLocaleString()}</span>
                  </div>
                  <div className="pp-breakdown-row">
                    <span>Base status points</span>
                    <span>{results.baseStatusPts.toLocaleString()}</span>
                  </div>
                  {results.statusBonusPct > 0 && (
                    <>
                      <div className="pp-breakdown-row pp-highlight">
                        <span>Elite status bonus (+{results.statusBonusPct}%)</span>
                        <span>+{(results.milesAfterStatus - results.baseMiles).toLocaleString()} mi / +{(results.statusPtsAfterStatus - results.baseStatusPts).toLocaleString()} SP</span>
                      </div>
                    </>
                  )}
                  {results.bofAApplied && (
                    <div className="pp-breakdown-row pp-highlight">
                      <span>Bank of America (+10%)</span>
                      <span>+{(results.milesAfterBofA - results.milesAfterStatus).toLocaleString()} mi</span>
                    </div>
                  )}
                  {results.cardMiles > 0 && (
                    <div className="pp-breakdown-row pp-highlight">
                      <span>Atmos Summit card</span>
                      <span>+{results.cardMiles.toLocaleString()} mi / +{results.cardStatusPts.toLocaleString()} SP</span>
                    </div>
                  )}
                  <div className="pp-breakdown-total">
                    <span>Total</span>
                    <span>{results.totalMiles.toLocaleString()} miles &middot; {results.totalStatusPts.toLocaleString()} SP</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="pp-empty">
                <p>Select an origin, destination, and fare class to see your estimated points earnings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
