import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiPlus, FiMinus, FiPackage, FiLoader, FiMapPin, FiX, FiLogIn, FiLogOut, FiEdit2, FiCheck as FiCheckIcon, FiInstagram, FiCamera, FiSettings, FiInfo, FiGlobe, FiDatabase, FiMail, FiTag } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { useAuth } from './context/AuthContext';
import useData from './hooks/useData';
import { useProfileByUsername } from './hooks/useProfile';
import { SECTION_TYPES, TAG_OPTIONS, getFlagUrl } from './data/defaultData';
import { getCityLabel } from './data/coordinates';
import CountryBanners from './components/CountryBanners';
import CityTabs from './components/CityTabs';
import SectionTabs from './components/SectionTabs';
import SearchFilter from './components/SearchFilter';
import EntryCard from './components/EntryCard';
import EntryDetail from './components/EntryDetail';
import EntryForm from './components/EntryForm';
import LoginModal from './components/LoginModal';
import MapView from './components/MapView';
import PhotoGallery from './components/PhotoGallery';
import InlineTextArea from './components/InlineTextArea';
import HomeMap from './components/HomeMap';

export default function App() {
  const { username, '*': subPath } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading, signIn, signOut, user, setViewedProfileId } = useAuth();
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useProfileByUsername(username);

  const profileUserId = profile?.id || null;

  useEffect(() => {
    setViewedProfileId(profileUserId);
    return () => setViewedProfileId(null);
  }, [profileUserId, setViewedProfileId]);

  const {
    data, loading: dataLoading, error,
    addCountry, removeCountry, updateCountryField,
    addCity, removeCity, reorderCities, updateCityField,
    addEntry, updateEntry, deleteEntry,
    updateEntryStatus, uploadImage
  } = useData(profileUserId);

  const countryMatch = (subPath || '').match(/^country\/(.+)/);
  const routeCountryId = countryMatch?.[1] || null;
  const isHomePage = !routeCountryId;

  const [activeCityId, setActiveCityId] = useState('all');
  const [activeSection, setActiveSection] = useState('All');
  const [detailEntry, setDetailEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editCountry, setEditCountry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [summaryItems, setSummaryItems] = useState([]);
  const [editingSummaryId, setEditingSummaryId] = useState(null);
  const [summaryDraft, setSummaryDraft] = useState({ label: '', text: '' });
  const [sectionTitle, setSectionTitle] = useState('');
  const [editingSectionTitle, setEditingSectionTitle] = useState(false);
  const [sectionTitleDraft, setSectionTitleDraft] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [tagline, setTagline] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [bio, setBio] = useState('');
  const [introEditing, setIntroEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [editingTagline, setEditingTagline] = useState(false);
  const [taglineDraft, setTaglineDraft] = useState('');
  const introFileRef = useRef(null);
  const profileFileRef = useRef(null);
  const scrollYRef = useRef(0);
  const [showSettings, setShowSettings] = useState(false);
  const [countryLoading, setCountryLoading] = useState(false);
  const settingsRef = useRef(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [mobileTaglineVisible, setMobileTaglineVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setMobileTaglineVisible(y < lastScrollY.current || y < 10);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const pItems = profile.summary_items || [];
    const pTitle = profile.section_title || '';
    const pPic = profile.profile_pic || '';

    if (pItems.length === 0 && !pTitle && !pPic && isAdmin) {
      const lsItems = localStorage.getItem('gp-summary-items');
      const lsTitle = localStorage.getItem('gp-section-title');
      const lsPic = localStorage.getItem('gp-profile-pic');
      const parsed = lsItems ? (() => { try { return JSON.parse(lsItems); } catch { return []; } })() : [];
      if (parsed.length > 0 || lsTitle || lsPic) {
        const migrated = {};
        if (parsed.length > 0) migrated.summary_items = parsed;
        if (lsTitle) migrated.section_title = lsTitle;
        if (lsPic) migrated.profile_pic = lsPic;
        updateProfile(migrated).then(() => {
          localStorage.removeItem('gp-summary-items');
          localStorage.removeItem('gp-section-title');
          localStorage.removeItem('gp-profile-pic');
        }).catch(console.error);
        setSummaryItems(parsed);
        setSectionTitle(lsTitle || '');
        setProfilePic(lsPic || '');
        return;
      }
    }

    setSummaryItems(pItems);
    setSectionTitle(pTitle);
    setProfilePic(pPic);
    setTagline(profile.tagline || '');
    setInstagramUrl(profile.instagram || '');
    setTiktokUrl(profile.tiktok || '');
    setBio(profile.bio || '');
  }, [profile, isAdmin, updateProfile]);

  const activeCountry = routeCountryId ? data.countries.find((c) => c.id === routeCountryId) : null;
  const resolvedCityId = activeCityId || 'all';
  const activeCity = resolvedCityId !== 'all' ? activeCountry?.cities.find((c) => c.id === resolvedCityId) : null;
  const cityLabel = getCityLabel(routeCountryId || '');

  useEffect(() => {
    if (routeCountryId && !activeCountry && data.countries.length > 0 && !dataLoading) {
      navigate(`/${username}`, { replace: true });
    }
  }, [routeCountryId, activeCountry, data.countries.length, dataLoading, navigate, username]);

  useEffect(() => {
    if (routeCountryId && scrollYRef.current > 0) {
      const y = scrollYRef.current;
      scrollYRef.current = 0;
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [routeCountryId]);

  useEffect(() => {
    if (!showSettings) return;
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  const entries = useMemo(() => {
    if (!activeCountry) return [];
    const collectFromCity = (city) => {
      if (activeSection === 'All') {
        return SECTION_TYPES.flatMap((s) =>
          (city.sections[s] || []).map((e) => ({ ...e, _city: city.name, _section: s }))
        );
      }
      return (city.sections[activeSection] || []).map((e) => ({ ...e, _city: city.name, _section: activeSection }));
    };
    let raw = resolvedCityId === 'all'
      ? activeCountry.cities.flatMap(collectFromCity)
      : activeCity ? collectFromCity(activeCity) : [];
    if (statusFilter !== 'all') raw = raw.filter((e) => e.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      raw = raw.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        (e.address || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return raw;
  }, [activeCountry, activeCity, resolvedCityId, activeSection, statusFilter, search]);

  const countryEntryCount = useMemo(() => {
    if (!activeCountry) return 0;
    return activeCountry.cities.reduce((sum, city) =>
      sum + Object.values(city.sections).reduce((s, arr) => s + arr.length, 0), 0);
  }, [activeCountry]);

  const countryHeaderRef = useRef(null);

  function handleSelectCountry(id) {
    scrollYRef.current = window.scrollY;
    setCountryLoading(true);
    setActiveCityId('all');
    setActiveSection('All');
    setSearch('');
    setStatusFilter('all');
    setShowTagManager(false);
    setNewTagInput('');
    navigate(`/${username}/country/${id}`);
    requestAnimationFrame(() => {
      setTimeout(() => setCountryLoading(false), 50);
      countryHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function handleAddCountry(d) {
    const id = await addCountry(d);
    navigate(`/${username}/country/${id}`);
    setActiveCityId('all');
  }
  async function handleRemoveCountry(id) {
    await removeCountry(id);
    navigate(`/${username}`);
  }
  async function handleAddCity(name) { const id = await addCity(routeCountryId, name); setActiveCityId(id); }
  async function handleRemoveCity(id) { await removeCity(id); if (resolvedCityId === id) setActiveCityId('all'); }
  async function handleReorderCities(orderedIds) { await reorderCities(routeCountryId, orderedIds); }

  async function handleAddEntry(entryData) {
    const targetCity = resolvedCityId !== 'all' ? resolvedCityId : activeCountry?.cities[0]?.id;
    const targetSection = entryData._section || (activeSection !== 'All' ? activeSection : 'Food');
    if (!targetCity) throw new Error('Select a specific ' + cityLabel.toLowerCase() + ' first.');
    const { _section, ...cleanData } = entryData;
    await addEntry(targetCity, targetSection, cleanData);
  }

  function handleStartEdit(entry) { setDetailEntry(null); setEditEntry(entry); }
  async function handleEditEntry(entryData) { await updateEntry(entryData.id, entryData); }

  function handleToggleStatus(entryId, newStatus) {
    if (detailEntry?.id === entryId) setDetailEntry((prev) => ({ ...prev, status: newStatus }));
    updateEntryStatus(entryId, newStatus);
  }

  async function saveCountryDesc(val) { await updateCountryField(routeCountryId, 'personal_description', val); }
  async function saveCountryNotes(val) { await updateCountryField(routeCountryId, 'notes', val); }
  async function saveCityDesc(val) { if (activeCity) await updateCityField(activeCity.id, 'description', val); }

  function startEditSectionTitle() { setSectionTitleDraft(sectionTitle); setEditingSectionTitle(true); }
  async function saveSectionTitle() {
    const v = sectionTitleDraft.trim();
    setSectionTitle(v);
    setEditingSectionTitle(false);
    try { if (profile) await updateProfile({ section_title: v }); } catch (e) { console.error(e); }
  }
  async function handleProfilePicUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setProfilePic(url);
      if (profile) await updateProfile({ profile_pic: url });
    } catch (err) { alert('Upload failed: ' + err.message); }
    if (profileFileRef.current) profileFileRef.current.value = '';
  }

  async function persistSummary(items) {
    setSummaryItems(items);
    try { if (profile) await updateProfile({ summary_items: items }); } catch (e) { console.error(e); }
  }
  function addSummaryItem() {
    const id = Date.now().toString();
    const next = [...summaryItems, { id, label: '', text: '' }];
    persistSummary(next);
    setSummaryDraft({ label: '', text: '' });
    setEditingSummaryId(id);
  }
  function startEditSummaryItem(item) {
    setSummaryDraft({ label: item.label, text: item.text });
    setEditingSummaryId(item.id);
  }
  function saveSummaryItem() {
    persistSummary(summaryItems.map((it) =>
      it.id === editingSummaryId ? { ...it, label: summaryDraft.label.trim(), text: summaryDraft.text.trim() } : it
    ));
    setEditingSummaryId(null);
  }
  function removeSummaryItem(id) {
    persistSummary(summaryItems.filter((it) => it.id !== id));
    if (editingSummaryId === id) setEditingSummaryId(null);
  }

  async function handleTrips(delta) {
    const current = activeCountry?.trips || 0;
    const next = Math.max(0, current + delta);
    await updateCountryField(routeCountryId, 'trips', next);
  }

  async function handleGalleryAdd(file, caption) {
    const url = await uploadImage(file);
    const current = activeCountry?.gallery || [];
    const item = JSON.stringify({ url, caption: caption || '' });
    await updateCountryField(routeCountryId, 'gallery', [...current.map(serializeGalleryItem), item]);
  }
  async function handleGalleryRemove(index) {
    const current = activeCountry?.gallery || [];
    await updateCountryField(routeCountryId, 'gallery', current.filter((_, i) => i !== index).map(serializeGalleryItem));
  }
  async function handleGalleryUpdateCaption(index, caption) {
    const current = activeCountry?.gallery || [];
    const updated = current.map((g, i) => {
      if (i !== index) return serializeGalleryItem(g);
      const obj = typeof g === 'object' ? g : { url: g, caption: '' };
      return JSON.stringify({ ...obj, caption });
    });
    await updateCountryField(routeCountryId, 'gallery', updated);
  }
  function serializeGalleryItem(g) {
    if (typeof g === 'string') return g.startsWith('{') ? g : JSON.stringify({ url: g, caption: '' });
    return JSON.stringify(g);
  }

  const activeCityTags = activeCity?.custom_tags || null;
  const effectiveTags = activeCityTags || TAG_OPTIONS;

  async function handleAddTag(tag) {
    if (!activeCity) return;
    const trimmed = tag.trim();
    if (!trimmed || effectiveTags.includes(trimmed)) return;
    const next = [...effectiveTags, trimmed];
    await updateCityField(activeCity.id, 'custom_tags', next);
  }
  async function handleRemoveTag(tag) {
    if (!activeCity) return;
    const next = effectiveTags.filter((t) => t !== tag);
    await updateCityField(activeCity.id, 'custom_tags', next);
  }
  async function handleResetTags() {
    if (!activeCity) return;
    await updateCityField(activeCity.id, 'custom_tags', null);
  }

  const sectionLabel = activeSection === 'All' ? 'All entries' : activeSection;
  const pluralLabel = cityLabel.toLowerCase().endsWith('y')
    ? cityLabel.toLowerCase().slice(0, -1) + 'ies'
    : cityLabel.toLowerCase() + 's';
  const cityDisplay = resolvedCityId === 'all' ? 'all ' + pluralLabel : activeCity?.name;
  const canAdd = resolvedCityId !== 'all';
  const tripsCount = activeCountry?.trips || 0;

  if (authLoading || profileLoading) {
    return <div className="loading-screen"><FiLoader size={28} className="spinner" /><p>Loading...</p></div>;
  }

  if (profileError || !profile) {
    return (
      <div className="loading-screen">
        <FiMapPin size={28} />
        <p>Profile not found.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Home</Link>
      </div>
    );
  }

  if (dataLoading) {
    return <div className="loading-screen"><FiLoader size={28} className="spinner" /><p>Loading data...</p></div>;
  }

  const summaryBlock = (isMobile) => (
    <div className="summary-card">
      <div className="summary-card-top">
        <div className="summary-title-area">
          {editingSectionTitle ? (
            <div className="summary-title-editor">
              <input className="summary-section-title-input" value={sectionTitleDraft} onChange={(e) => setSectionTitleDraft(e.target.value)} placeholder={isMobile ? 'Title...' : 'Section title...'} autoFocus={!isMobile} onKeyDown={(e) => e.key === 'Enter' && saveSectionTitle()} />
              <button className="btn btn-primary btn-sm" onClick={saveSectionTitle}><FiCheckIcon size={isMobile ? 11 : 12} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingSectionTitle(false)}><FiX size={isMobile ? 11 : 12} /></button>
            </div>
          ) : (
            <div className="summary-title-display">
              {sectionTitle ? <h3 className="summary-section-title">{sectionTitle}</h3> : isAdmin && <h3 className="summary-section-title summary-placeholder">{isMobile ? 'Add title...' : 'Add a section title...'}</h3>}
              {isAdmin && <button className="desc-edit-btn" onClick={startEditSectionTitle}><FiEdit2 size={isMobile ? 10 : 11} /></button>}
            </div>
          )}
        </div>
      </div>
      <div className="summary-items-grid">
        {summaryItems.map((item) => (
          <div key={item.id} className="summary-item">
            {editingSummaryId === item.id ? (
              <div className="summary-item-editor">
                <input className="summary-label-input" value={summaryDraft.label} onChange={(e) => setSummaryDraft((d) => ({ ...d, label: e.target.value }))} placeholder="Label" autoFocus={!isMobile} />
                <textarea className="summary-text-input" value={summaryDraft.text} onChange={(e) => setSummaryDraft((d) => ({ ...d, text: e.target.value }))} placeholder="Text content..." rows={2} />
                <div className="summary-item-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingSummaryId(null)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={saveSummaryItem}><FiCheckIcon size={12} /> Save</button>
                </div>
              </div>
            ) : (
              <div className="summary-item-display">
                <div className="summary-item-content">
                  {item.label && <span className="summary-item-label">{item.label}</span>}
                  {item.text && <p className="summary-item-text">{item.text}</p>}
                  {!item.label && !item.text && <span className="summary-placeholder">Empty — click edit</span>}
                </div>
                {isAdmin && (
                  <div className="summary-item-btns">
                    <button className="desc-edit-btn" onClick={() => startEditSummaryItem(item)}><FiEdit2 size={11} /></button>
                    <button className="desc-edit-btn" onClick={() => removeSummaryItem(item.id)}><FiX size={11} /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <button className="summary-add-btn" onClick={addSummaryItem}><FiPlus size={13} /> Add stat</button>
      )}
    </div>
  );

  const hasSummary = summaryItems.length > 0 || sectionTitle || isAdmin;

  return (
    <div className="app">
      <nav className="topnav">
        <Link to="/" className="topnav-brand">global.io</Link>
        <div className="topnav-center">
          {editingTagline ? (
            <div className="topnav-tagline-edit">
              <span className="topnav-tagline-prefix">{profile.display_name || username}'s Portfolio: </span>
              <input
                className="topnav-tagline-input"
                value={taglineDraft}
                onChange={(e) => setTaglineDraft(e.target.value)}
                placeholder="your tagline..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateProfile({ tagline: taglineDraft.trim() }).then(() => { setTagline(taglineDraft.trim()); setEditingTagline(false); }).catch((err) => alert('Save failed: ' + err.message));
                  } else if (e.key === 'Escape') { setEditingTagline(false); }
                }}
              />
              <button className="topnav-tagline-save" onClick={() => {
                updateProfile({ tagline: taglineDraft.trim() }).then(() => { setTagline(taglineDraft.trim()); setEditingTagline(false); }).catch((err) => alert('Save failed: ' + err.message));
              }}><FiCheckIcon size={11} /></button>
              <button className="topnav-tagline-cancel" onClick={() => setEditingTagline(false)}><FiX size={11} /></button>
            </div>
          ) : (
            <>
              <Link to={`/${username}`} className="topnav-tagline">
                {profile.display_name || username}'s Portfolio{tagline ? ': ' + tagline : ''}
              </Link>
              {isAdmin && <button className="topnav-tagline-edit-btn" onClick={() => { setTaglineDraft(tagline); setEditingTagline(true); }}><FiEdit2 size={10} /></button>}
            </>
          )}
        </div>
        <div className="topnav-right">
          <Link to="/" className="topnav-link">Home</Link>
          {!user && (
            <button className="topnav-btn" onClick={() => setShowLogin(true)}><FiLogIn size={12} /> Sign in</button>
          )}
          {user && (
            <button className="topnav-btn" onClick={signOut}><FiLogOut size={12} /> Sign out</button>
          )}
          {user && <div className="settings-wrapper" ref={settingsRef}>
            <button className="topnav-settings-btn" onClick={() => setShowSettings((p) => !p)} aria-label="Settings"><FiSettings size={15} /></button>
            {showSettings && (
              <div className="settings-dropdown">
                <div className="settings-header">Settings & Info</div>
                <div className="settings-section">
                  <div className="settings-item">
                    <FiGlobe size={13} />
                    <div className="settings-item-info">
                      <span className="settings-item-label">Countries</span>
                      <span className="settings-item-value">{data.countries.length}</span>
                    </div>
                  </div>
                  <div className="settings-item">
                    <FiDatabase size={13} />
                    <div className="settings-item-info">
                      <span className="settings-item-label">Total entries</span>
                      <span className="settings-item-value">{data.countries.reduce((sum, c) => sum + c.cities.reduce((s, ci) => s + Object.values(ci.sections).reduce((a, arr) => a + arr.length, 0), 0), 0)}</span>
                    </div>
                  </div>
                  <div className="settings-item">
                    <FiMapPin size={13} />
                    <div className="settings-item-info">
                      <span className="settings-item-label">Total cities/states</span>
                      <span className="settings-item-value">{data.countries.reduce((sum, c) => sum + c.cities.length, 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="settings-divider" />
                <div className="settings-section">
                  <div className="settings-item">
                    <FiInfo size={13} />
                    <div className="settings-item-info">
                      <span className="settings-item-label">Version</span>
                      <span className="settings-item-value">1.0.0</span>
                    </div>
                  </div>
                  <div className="settings-item">
                    <FiMail size={13} />
                    <div className="settings-item-info">
                      <span className="settings-item-label">Profile</span>
                      <span className="settings-item-value settings-link">@{username}</span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <>
                    <div className="settings-divider" />
                    <div className="settings-section">
                      <Link to={`/${username}/manage`} className="settings-manage-link" onClick={() => setShowSettings(false)}>
                        <FiDatabase size={13} />
                        <span>Manage all entries</span>
                      </Link>
                    </div>
                    <div className="settings-divider" />
                    <div className="settings-section">
                      <div className="settings-pic-row">
                        {profilePic && <img src={profilePic} alt="" className="settings-pic-thumb" />}
                        <div className="settings-pic-btns">
                          <button className="settings-pic-btn" onClick={() => profileFileRef.current?.click()}><FiCamera size={11} /> {profilePic ? 'Change' : 'Upload'}</button>
                          {profilePic && <button className="settings-pic-btn settings-pic-btn-danger" onClick={async () => {
                            try { await updateProfile({ profile_pic: '' }); setProfilePic(''); } catch (err) { alert('Failed: ' + err.message); }
                          }}><FiX size={11} /> Remove</button>}
                        </div>
                      </div>
                      <input ref={profileFileRef} type="file" accept="image/*" onChange={handleProfilePicUpload} hidden />
                    </div>
                    
                  </>
                )}
              </div>
            )}
          </div>}
        </div>
      </nav>

      <div className={`mobile-tagline-bar${mobileTaglineVisible ? '' : ' mobile-tagline-hidden'}`}>
        <Link to={`/${username}`} className="mobile-tagline-link">
          {profile.display_name || username}'s Portfolio{tagline ? ': ' + tagline : ''}
        </Link>
      </div>

      <CountryBanners
        countries={data.countries}
        onSelect={handleSelectCountry}
        onAddCountry={handleAddCountry}
        onUpdateBanner={async (id, url) => updateCountryField(id, 'banner', url)}
        uploadImage={uploadImage}
      />

      {isHomePage && (
        <div className="profile-intro">
          <div className={`intro-avatar${introEditing ? ' editable' : ''}`} onClick={() => introEditing && introFileRef.current?.click()}>
            {profilePic ? (
              <img src={profilePic} alt="" />
            ) : (
              <span className="intro-avatar-placeholder"><FiCamera size={24} /></span>
            )}
            {introEditing && <span className="intro-avatar-overlay"><FiCamera size={16} /></span>}
          </div>
          <input ref={introFileRef} type="file" accept="image/*" onChange={handleProfilePicUpload} hidden />
          <div className="intro-body">
            <div className="intro-header-row">
              <div className="intro-name">{profile.display_name || username}'s Portfolio</div>
              {isAdmin && !introEditing && (
                <button className="intro-edit-btn" onClick={() => { setBioDraft(bio); setIntroEditing(true); }}><FiEdit2 size={12} /> Edit</button>
              )}
            </div>
            <div className="intro-bio">
              {introEditing ? (
                <textarea
                  className="intro-bio-input"
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  placeholder="Write a brief introduction..."
                  rows={3}
                />
              ) : (
                <p>{bio || (isAdmin ? 'No introduction yet.' : '')}</p>
              )}
            </div>
            <div className="intro-socials">
              {!introEditing && instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="intro-social-link"><FiInstagram size={14} /> Instagram</a>
              )}
              {!introEditing && tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="intro-social-link"><FaTiktok size={12} /> TikTok</a>
              )}
              {introEditing && (
                <div className="intro-social-edit">
                  <div className="intro-social-field">
                    <label><FiInstagram size={12} /> Instagram</label>
                    <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="intro-social-field">
                    <label><FaTiktok size={10} /> TikTok</label>
                    <input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@..." />
                  </div>
                </div>
              )}
            </div>
            {introEditing && (
              <div className="intro-actions">
                <button className="btn btn-primary btn-sm" onClick={async () => {
                  try {
                    await updateProfile({ bio: bioDraft, instagram: instagramUrl.trim(), tiktok: tiktokUrl.trim() });
                    setBio(bioDraft);
                    setIntroEditing(false);
                  } catch (err) { alert('Save failed: ' + err.message); }
                }}><FiCheckIcon size={11} /> Save</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="content-spacer">
        {isHomePage && hasSummary && (
          <div className="spacer-desktop-summary">{summaryBlock(false)}</div>
        )}

        {isHomePage && hasSummary && (
          <div className="spacer-mobile-summary">{summaryBlock(true)}</div>
        )}
      </div>

      {isHomePage && (
        <div className="content-area">
          {data.countries.length === 0 && (
            <div className="content-panel"><div className="content-inner"><div className="empty-state"><FiMapPin size={36} /><p>{isAdmin ? "Add your first country to get started." : "Nothing here yet — check back soon."}</p></div></div></div>
          )}
          {data.countries.length > 0 && (
            <div className="content-panel"><div className="content-inner">
              <HomeMap countries={data.countries} />
            </div></div>
          )}

        </div>
      )}

      {countryLoading && (
        <div className="country-loading-bar"><div className="country-loading-fill" /></div>
      )}

      {!isHomePage && activeCountry && (
        <div className={`content-area${countryLoading ? ' content-loading' : ''}`}>
          {error && <div className="error-banner"><p>{error}</p></div>}
          <div className="content-panel">
            <div ref={countryHeaderRef} className="country-header-bar" style={activeCountry.banner ? { backgroundImage: `url(${activeCountry.banner})` } : undefined}>
              <div className="ch-overlay" />
              <div className="ch-inner">
                {getFlagUrl(activeCountry.code || activeCountry.id, 48) && (
                  <img src={getFlagUrl(activeCountry.code || activeCountry.id, 48)} alt="" className="ch-flag" loading="lazy" />
                )}
                <div className="ch-info">
                  <h2 className="ch-name">{activeCountry.name}</h2>
                  <p className="ch-meta">
                    {activeCountry.cities.length} {activeCountry.cities.length !== 1 ? pluralLabel : cityLabel.toLowerCase()} &middot; {countryEntryCount} entries &middot; {tripsCount} trip{tripsCount !== 1 ? 's' : ''}
                    {isAdmin && (
                      <span className="trips-controls">
                        <button onClick={(e) => { e.stopPropagation(); handleTrips(-1); }}><FiMinus size={10} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleTrips(1); }}><FiPlus size={10} /></button>
                      </span>
                    )}
                  </p>
                </div>
                {isAdmin && (
                  <div className="ch-actions">
                    <button className="ch-action-btn" onClick={() => setEditCountry({ id: activeCountry.id, name: activeCountry.name, code: activeCountry.code || '', description: activeCountry.description || '' })} title="Edit country">
                      <FiEdit2 size={14} />
                    </button>
                    <button className="ch-action-btn ch-action-danger" onClick={() => { setDeleteConfirm({ id: activeCountry.id, name: activeCountry.name }); setDeletePassword(''); setDeleteError(''); }} title="Remove country">
                      <FiX size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="content-inner">
              <div className="country-visited-row">
                <label className="visited-toggle">
                  <input
                    type="checkbox"
                    checked={activeCountry.visited}
                    onChange={() => isAdmin && updateCountryField(activeCountry.id, 'visited', !activeCountry.visited)}
                    disabled={!isAdmin}
                  />
                  <span className="visited-slider" />
                  <span className={`visited-label ${activeCountry.visited ? 'visited-yes' : 'visited-no'}`}>
                    {activeCountry.visited ? 'Visited' : 'Not visited yet'}
                  </span>
                </label>
              </div>
              <div className="personal-desc-section">
                <InlineTextArea value={activeCountry.personal_description} onSave={saveCountryDesc} placeholder={`Write a personal description about ${activeCountry.name}...`} isAdmin={isAdmin} minRows={3} />
              </div>

              <PhotoGallery images={activeCountry.gallery} onAdd={handleGalleryAdd} onRemove={handleGalleryRemove} onUpdateCaption={handleGalleryUpdateCaption} />

              <div className="hierarchy-section">
                <span className="hierarchy-label">{cityLabel}</span>
                <CityTabs cities={activeCountry.cities} activeCity={resolvedCityId} onSelect={setActiveCityId} onAddCity={handleAddCity} onRemoveCity={handleRemoveCity} onReorder={handleReorderCities} cityLabel={cityLabel} />
              </div>

              {activeCity && (
                <div className="city-desc-section">
                  <div className="city-visited-row">
                    <label className="visited-toggle">
                      <input
                        type="checkbox"
                        checked={activeCity.visited}
                        onChange={() => isAdmin && updateCityField(activeCity.id, 'visited', !activeCity.visited)}
                        disabled={!isAdmin}
                      />
                      <span className="visited-slider" />
                      <span className={`visited-label ${activeCity.visited ? 'visited-yes' : 'visited-no'}`}>
                        {activeCity.visited ? 'Visited' : 'Not visited yet'}
                      </span>
                    </label>
                  </div>
                  <InlineTextArea value={activeCity.description} onSave={saveCityDesc} placeholder={`Write about ${activeCity.name}...`} isAdmin={isAdmin} minRows={2} />

                  {isAdmin && (
                    <div className="tag-manager-section">
                      <button className="tag-manager-toggle" onClick={() => setShowTagManager((p) => !p)}>
                        <FiTag size={14} />
                        <span>Tags for {activeCity.name}</span>
                        <span className="tag-manager-count">{effectiveTags.length}</span>
                      </button>

                      {showTagManager && (
                        <div className="tag-manager-body">
                          <div className="tag-manager-add-row">
                            <input
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              placeholder="Add a new tag..."
                              onKeyDown={(e) => { if (e.key === 'Enter') { handleAddTag(newTagInput); setNewTagInput(''); } }}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => { handleAddTag(newTagInput); setNewTagInput(''); }}
                              disabled={!newTagInput.trim()}
                            >
                              <FiPlus size={12} /> Add
                            </button>
                          </div>

                          <div className="tag-manager-list">
                            {effectiveTags.map((tag) => (
                              <div key={tag} className="tag-manager-item">
                                <span>{tag}</span>
                                <button className="tag-manager-remove" onClick={() => handleRemoveTag(tag)}>
                                  <FiX size={10} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {activeCityTags && (
                            <button className="btn btn-ghost btn-sm tag-manager-reset" onClick={handleResetTags}>
                              Reset to defaults
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="hierarchy-section">
                <span className="hierarchy-label">Category</span>
                <SectionTabs activeSection={activeSection} onSelect={setActiveSection} />
              </div>

              <SearchFilter search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusChange={setStatusFilter} />

              <div className="entries-header">
                <h3>{sectionLabel} in {cityDisplay}</h3>
                <div className="entries-header-right">
                  <span className="entries-count">{entries.length} result{entries.length !== 1 ? 's' : ''}</span>
                  {isAdmin && canAdd && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}><FiPlus size={14} /> Add Entry</button>
                  )}
                </div>
              </div>

              <div className="entries-layout">
                <div className="entries-main">
                  {entries.length === 0 ? (
                    <div className="empty-state"><FiPackage size={36} /><p>{search || statusFilter !== 'all' ? 'No matching entries.' : 'No entries yet.'}</p></div>
                  ) : (
                    <div className="entries-grid">
                      {entries.map((entry) => (
                        <EntryCard key={entry.id} entry={entry} onClick={setDetailEntry} onDelete={(id) => deleteEntry(id)} cityName={resolvedCityId === 'all' ? entry._city : null} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="entries-sidebar">
                  <MapView entries={entries} countryId={routeCountryId} cityId={resolvedCityId} cityName={activeCity?.name} countryName={activeCountry?.name} />
                  <div className="notes-section">
                    <div className="notes-header"><h4>Notes</h4></div>
                    <InlineTextArea value={activeCountry.notes} onSave={saveCountryNotes} placeholder="Jot down notes, reminders, tips..." isAdmin={isAdmin} minRows={4} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailEntry && <EntryDetail entry={detailEntry} section={detailEntry._section} onClose={() => setDetailEntry(null)} onToggleStatus={handleToggleStatus} onEdit={handleStartEdit} />}
      {showForm && <EntryForm onSubmit={handleAddEntry} onClose={() => setShowForm(false)} uploadImage={uploadImage} defaultSection={activeSection !== 'All' ? activeSection : undefined} cityName={activeCity?.name} tagOptions={effectiveTags} />}
      {editEntry && <EntryForm onSubmit={handleEditEntry} onClose={() => setEditEntry(null)} uploadImage={uploadImage} initialData={editEntry} tagOptions={effectiveTags} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {editCountry && (
        <div className="modal-overlay" onClick={() => setEditCountry(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Country</h2>
              <button className="icon-btn" onClick={() => setEditCountry(null)}><FiX /></button>
            </div>
            <div className="form-group">
              <label>Country Name</label>
              <input value={editCountry.name} onChange={(e) => setEditCountry((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Country Code (2 letters)</label>
              <input value={editCountry.code} onChange={(e) => setEditCountry((p) => ({ ...p, code: e.target.value }))} maxLength={2} />
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Banner Description</label>
              <textarea value={editCountry.description} onChange={(e) => setEditCountry((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Short description for the banner..." />
            </div>
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setEditCountry(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                await updateCountryField(editCountry.id, 'name', editCountry.name.trim());
                await updateCountryField(editCountry.id, 'code', editCountry.code.trim().toLowerCase());
                await updateCountryField(editCountry.id, 'description', editCountry.description.trim());
                setEditCountry(null);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Country</h2>
              <button className="icon-btn" onClick={() => setDeleteConfirm(null)}><FiX /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 8 }}>
              This will permanently delete <strong>{deleteConfirm.name}</strong> and all its cities, entries, and data.
            </p>
            <p style={{ fontSize: '0.82rem', color: '#dc2626', marginBottom: 16 }}>
              Re-enter your password to confirm.
            </p>
            {deleteError && <div className="login-error">{deleteError}</div>}
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && deletePassword && document.getElementById('confirm-delete-btn')?.click()}
              />
            </div>
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                id="confirm-delete-btn"
                className="btn btn-danger"
                disabled={!deletePassword}
                onClick={async () => {
                  try {
                    await signIn(user.email, deletePassword);
                    await handleRemoveCountry(deleteConfirm.id);
                    setDeleteConfirm(null);
                    setDeletePassword('');
                  } catch (err) {
                    setDeleteError(err.message?.includes('Invalid') ? 'Incorrect password' : err.message);
                  }
                }}
              >Delete {deleteConfirm.name}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
