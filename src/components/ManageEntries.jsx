import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiCheck, FiX, FiFilter, FiSave, FiLoader, FiSearch, FiImage, FiUpload } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useProfileByUsername } from '../hooks/useProfile';
import useData from '../hooks/useData';
import { SECTION_TYPES, TAG_OPTIONS, RECOMMENDATION_OPTIONS } from '../data/defaultData';
import { v4 as uuidv4 } from 'uuid';

const STATUS_OPTS = [
  { value: 'visited', label: 'Been Here' },
  { value: 'bucket-list', label: 'Want to Go' },
];

function RatingInput({ value, onChange }) {
  const [text, setText] = useState(value ? value.toFixed(1) : '');
  const [error, setError] = useState(false);

  useEffect(() => {
    setText(value ? value.toFixed(1) : '');
  }, [value]);

  function handleBlur() {
    if (text.trim() === '') { setError(false); onChange(0); return; }
    const num = parseFloat(text);
    if (isNaN(num) || num < 0 || num > 5 || (num * 2) % 1 !== 0) {
      setError(true);
      return;
    }
    setError(false);
    setText(num.toFixed(1));
    onChange(num);
  }

  return (
    <input
      className={`manage-input manage-input-sm${error ? ' manage-input-error' : ''}`}
      value={text}
      onChange={(e) => { setText(e.target.value); setError(false); }}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
      placeholder="0.0"
    />
  );
}

function InlineSelect({ value, options, onChange, className }) {
  return (
    <select className={`manage-select ${className || ''}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

function TagCell({ tags, allTags, onChange }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleOpen() {
    if (open) { setOpen(false); return; }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownH = Math.min(240, allTags.length * 30 + 12);
      const top = spaceBelow > dropdownH ? rect.bottom + 2 : rect.top - dropdownH - 2;
      setPos({ top, left: rect.left });
    }
    setOpen(true);
  }

  const toggle = (tag) => {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    onChange(next);
  };

  return (
    <div className="manage-tag-cell">
      <div className="manage-tag-display" ref={triggerRef} onClick={handleOpen}>
        {tags.length === 0 ? <span className="manage-placeholder">—</span> : (
          tags.map((t) => <span key={t} className="manage-tag-chip">{t}</span>)
        )}
      </div>
      {open && (
        <div className="manage-tag-dropdown" ref={dropdownRef} style={{ position: 'fixed', top: pos.top, left: pos.left }}>
          {allTags.map((tag) => (
            <label key={tag} className="manage-tag-option">
              <input type="checkbox" checked={tags.includes(tag)} onChange={() => toggle(tag)} />
              <span>{tag}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function NewRowImageCell({ images, onAdd, onRemove }) {
  const fileRef = useRef(null);
  return (
    <div className="manage-img-cell">
      {images.map((img, i) => (
        <div key={i} className="manage-img-thumb">
          <img src={img.preview} alt="" />
          <button className="manage-img-remove" onClick={() => onRemove(i)}><FiX size={8} /></button>
        </div>
      ))}
      <button className="manage-img-add" onClick={() => fileRef.current?.click()} title="Add image">
        <FiUpload size={11} />
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { onAdd(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

function ExistingImageCell({ entry, uploadImage, onFieldChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const images = entry.images?.length ? entry.images : entry.image ? [entry.image] : [];

  async function handleFiles(files) {
    setUploading(true);
    try {
      const newUrls = [...images];
      for (const f of Array.from(files)) {
        const url = await uploadImage(f);
        newUrls.push(url);
      }
      onFieldChange(entry.id, 'images', newUrls);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx) {
    const next = images.filter((_, i) => i !== idx);
    onFieldChange(entry.id, 'images', next);
  }

  return (
    <div className="manage-img-cell">
      {images.map((url, i) => (
        <div key={i} className="manage-img-thumb">
          <img src={url} alt="" />
          <button className="manage-img-remove" onClick={() => removeImage(i)}><FiX size={8} /></button>
        </div>
      ))}
      {uploading ? (
        <FiLoader size={11} className="spinner" style={{ color: 'var(--accent)' }} />
      ) : (
        <button className="manage-img-add" onClick={() => fileRef.current?.click()} title="Add image">
          <FiUpload size={11} />
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

export default function ManageEntries() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, setViewedProfileId } = useAuth();
  const { profile, loading: profileLoading } = useProfileByUsername(username);

  const profileUserId = profile?.id || null;
  useEffect(() => {
    setViewedProfileId(profileUserId);
    return () => setViewedProfileId(null);
  }, [profileUserId, setViewedProfileId]);

  const isAdmin = !!user && !!profileUserId && user.id === profileUserId;

  const {
    data, loading: dataLoading,
    addEntry, updateEntry, deleteEntry, updateEntryStatus, uploadImage
  } = useData(profileUserId);

  const [filterCountry, setFilterCountry] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [saving, setSaving] = useState({});
  const [newRows, setNewRows] = useState([]);

  const allEntries = useMemo(() => {
    const rows = [];
    for (const country of data.countries) {
      for (const city of country.cities) {
        for (const section of SECTION_TYPES) {
          for (const entry of (city.sections[section] || [])) {
            rows.push({
              ...entry,
              _countryId: country.id,
              _countryName: country.name,
              _cityId: city.id,
              _cityName: city.name,
              _section: section,
              _cityTags: city.custom_tags || null,
            });
          }
        }
      }
    }
    return rows;
  }, [data]);

  const filteredEntries = useMemo(() => {
    let rows = allEntries;
    if (filterCountry !== 'all') rows = rows.filter((r) => r._countryId === filterCountry);
    if (filterCity !== 'all') rows = rows.filter((r) => r._cityId === filterCity);
    if (filterSection !== 'all') rows = rows.filter((r) => r._section === filterSection);
    if (filterStatus !== 'all') rows = rows.filter((r) => r.status === filterStatus);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      rows = rows.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        (r.address || '').toLowerCase().includes(q) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [allEntries, filterCountry, filterCity, filterSection, filterStatus, searchText]);

  const availableCities = useMemo(() => {
    if (filterCountry === 'all') {
      return data.countries.flatMap((c) => c.cities.map((ci) => ({ id: ci.id, name: `${ci.name} (${c.name})` })));
    }
    const country = data.countries.find((c) => c.id === filterCountry);
    return country ? country.cities.map((ci) => ({ id: ci.id, name: ci.name })) : [];
  }, [data, filterCountry]);

  const cityTagsMap = useMemo(() => {
    const map = {};
    for (const country of data.countries) {
      for (const city of country.cities) {
        map[city.id] = city.custom_tags || null;
      }
    }
    return map;
  }, [data]);

  function getTagsForCity(cityId) {
    return cityTagsMap[cityId] || TAG_OPTIONS;
  }

  const debounceRef = useRef({});

  function scheduleUpdate(entryId, field, value) {
    const key = `${entryId}:${field}`;
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);

    setSaving((prev) => ({ ...prev, [entryId]: true }));

    debounceRef.current[key] = setTimeout(async () => {
      try {
        if (field === 'status') {
          await updateEntryStatus(entryId, value);
        } else {
          await updateEntry(entryId, { [field]: value });
        }
      } catch (err) {
        console.error('Save failed:', err);
      } finally {
        setSaving((prev) => ({ ...prev, [entryId]: false }));
        delete debounceRef.current[key];
      }
    }, 600);
  }

  function handleFieldChange(entryId, field, value) {
    scheduleUpdate(entryId, field, value);
  }

  function handleRatingChange(entryId, entry, ratingField, ratingValue) {
    const newRating = { ...entry.rating, [ratingField]: ratingValue };
    scheduleUpdate(entryId, 'rating', newRating);
  }

  async function handleDeleteEntry(entryId, name) {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteEntry(entryId);
  }

  function addNewRow() {
    const firstCountry = data.countries[0];
    const firstCity = firstCountry?.cities[0];
    setNewRows((prev) => [...prev, {
      _tempId: uuidv4(),
      name: '',
      address: '',
      section: filterSection !== 'all' ? filterSection : 'Food',
      status: 'bucket-list',
      tags: [],
      repeatability: '',
      description: '',
      rating: { taste: 0, value: 0, experience: 0 },
      _countryId: filterCountry !== 'all' ? filterCountry : (firstCountry?.id || ''),
      _cityId: filterCity !== 'all' ? filterCity : (firstCity?.id || ''),
      _imageFiles: [],
    }]);
  }

  function handleNewRowFile(tempId, files) {
    const entries = Array.from(files).map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setNewRows((prev) => prev.map((r) =>
      r._tempId === tempId ? { ...r, _imageFiles: [...r._imageFiles, ...entries] } : r
    ));
  }

  function removeNewRowImage(tempId, idx) {
    setNewRows((prev) => prev.map((r) =>
      r._tempId === tempId ? { ...r, _imageFiles: r._imageFiles.filter((_, i) => i !== idx) } : r
    ));
  }

  function updateNewRow(tempId, field, value) {
    setNewRows((prev) => prev.map((r) => r._tempId === tempId ? { ...r, [field]: value } : r));
  }

  function updateNewRowRating(tempId, ratingField, ratingValue) {
    setNewRows((prev) => prev.map((r) => {
      if (r._tempId !== tempId) return r;
      return { ...r, rating: { ...r.rating, [ratingField]: ratingValue } };
    }));
  }

  async function saveNewRow(tempId) {
    const row = newRows.find((r) => r._tempId === tempId);
    if (!row || !row.name.trim() || !row._cityId) return;
    setSaving((prev) => ({ ...prev, [tempId]: true }));
    try {
      const imageUrls = [];
      for (const img of (row._imageFiles || [])) {
        if (img.file) {
          const url = await uploadImage(img.file);
          imageUrls.push(url);
        }
      }
      await addEntry(row._cityId, row.section, {
        name: row.name.trim(),
        address: row.address.trim(),
        status: row.status,
        tags: row.tags,
        repeatability: row.repeatability,
        description: row.description,
        rating: row.rating,
        ...(imageUrls.length > 0 && { images: imageUrls, image: imageUrls[0] }),
      });
      setNewRows((prev) => prev.filter((r) => r._tempId !== tempId));
    } catch (err) {
      console.error('Add failed:', err);
    } finally {
      setSaving((prev) => ({ ...prev, [tempId]: false }));
    }
  }

  function discardNewRow(tempId) {
    setNewRows((prev) => prev.filter((r) => r._tempId !== tempId));
  }

  if (authLoading || profileLoading || dataLoading) {
    return <div className="loading-screen"><FiLoader size={28} className="spinner" /><p>Loading...</p></div>;
  }

  if (!isAdmin) {
    return (
      <div className="loading-screen">
        <p>You must be signed in as the owner to manage entries.</p>
        <Link to={`/${username}`} className="btn btn-primary" style={{ marginTop: 16 }}>Back to Profile</Link>
      </div>
    );
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div className="manage-header-left">
          <Link to={`/${username}`} className="manage-back"><FiArrowLeft size={16} /></Link>
          <h1>Manage entries</h1>
          <span className="manage-count">{filteredEntries.length} entries</span>
        </div>
        <button className="btn btn-primary" onClick={addNewRow}>
          <FiPlus size={14} /> Add Row
        </button>
      </div>

      <div className="manage-filters">
        <div className="manage-search">
          <FiSearch size={14} />
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search entries..." />
        </div>
        <div className="manage-filter-group">
          <FiFilter size={12} />
          <select value={filterCountry} onChange={(e) => { setFilterCountry(e.target.value); setFilterCity('all'); }}>
            <option value="all">All Countries</option>
            {data.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
            <option value="all">All Cities</option>
            {availableCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
            <option value="all">All Categories</option>
            {SECTION_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="manage-table-wrapper">
        <table className="manage-table">
          <thead>
            <tr>
              <th className="col-status">Status</th>
              <th className="col-img">Img</th>
              <th className="col-name">Name</th>
              <th className="col-location">Location</th>
              <th className="col-section">Category</th>
              <th className="col-address">Address</th>
              <th className="col-tags">Tags</th>
              <th className="col-rec">Rec.</th>
              <th className="col-rating">Qual.</th>
              <th className="col-rating">Val.</th>
              <th className="col-rating">Exp.</th>
              <th className="col-desc">Description</th>
              <th className="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {newRows.map((row) => (
              <tr key={row._tempId} className="manage-row manage-row-new">
                <td>
                  <InlineSelect
                    value={row.status}
                    options={STATUS_OPTS}
                    onChange={(v) => updateNewRow(row._tempId, 'status', v)}
                  />
                </td>
                <td>
                  <NewRowImageCell
                    images={row._imageFiles || []}
                    onAdd={(files) => handleNewRowFile(row._tempId, files)}
                    onRemove={(idx) => removeNewRowImage(row._tempId, idx)}
                  />
                </td>
                <td>
                  <input
                    className="manage-input"
                    value={row.name}
                    onChange={(e) => updateNewRow(row._tempId, 'name', e.target.value)}
                    placeholder="Entry name *"
                    autoFocus
                  />
                </td>
                <td>
                  <select
                    className="manage-select"
                    value={row._cityId}
                    onChange={(e) => updateNewRow(row._tempId, '_cityId', e.target.value)}
                  >
                    <option value="">Select city...</option>
                    {data.countries.flatMap((c) =>
                      c.cities.map((ci) => <option key={ci.id} value={ci.id}>{ci.name} ({c.name})</option>)
                    )}
                  </select>
                </td>
                <td>
                  <InlineSelect
                    value={row.section}
                    options={SECTION_TYPES.map((s) => ({ value: s, label: s }))}
                    onChange={(v) => updateNewRow(row._tempId, 'section', v)}
                  />
                </td>
                <td>
                  <input
                    className="manage-input"
                    value={row.address}
                    onChange={(e) => updateNewRow(row._tempId, 'address', e.target.value)}
                    placeholder="Address"
                  />
                </td>
                <td>
                  <TagCell
                    tags={row.tags}
                    allTags={getTagsForCity(row._cityId)}
                    onChange={(v) => updateNewRow(row._tempId, 'tags', v)}
                  />
                </td>
                <td>
                  <InlineSelect
                    value={row.repeatability}
                    options={[{ value: '', label: '—' }, ...RECOMMENDATION_OPTIONS.map((o) => ({ value: o, label: o }))]}
                    onChange={(v) => updateNewRow(row._tempId, 'repeatability', v)}
                  />
                </td>
                <td><RatingInput value={row.rating.taste} onChange={(v) => updateNewRowRating(row._tempId, 'taste', v)} /></td>
                <td><RatingInput value={row.rating.value} onChange={(v) => updateNewRowRating(row._tempId, 'value', v)} /></td>
                <td><RatingInput value={row.rating.experience} onChange={(v) => updateNewRowRating(row._tempId, 'experience', v)} /></td>
                <td>
                  <input
                    className="manage-input"
                    value={row.description}
                    onChange={(e) => updateNewRow(row._tempId, 'description', e.target.value)}
                    placeholder="Description"
                  />
                </td>
                <td className="manage-actions-cell">
                  <div className="manage-actions-inner">
                    <button
                      className="manage-action-btn manage-save-btn"
                      onClick={() => saveNewRow(row._tempId)}
                      disabled={!row.name.trim() || !row._cityId || saving[row._tempId]}
                      title="Save"
                    >
                      {saving[row._tempId] ? <FiLoader size={12} className="spinner" /> : <FiCheck size={12} />}
                    </button>
                    <button className="manage-action-btn manage-delete-btn" onClick={() => discardNewRow(row._tempId)} title="Discard">
                      <FiX size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredEntries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                saving={!!saving[entry.id]}
                onFieldChange={handleFieldChange}
                onRatingChange={handleRatingChange}
                onDelete={handleDeleteEntry}
                allTags={entry._cityTags || TAG_OPTIONS}
                uploadImage={uploadImage}
              />
            ))}
          </tbody>
        </table>

        {filteredEntries.length === 0 && newRows.length === 0 && (
          <div className="manage-empty">
            <p>No entries match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EntryRow({ entry, saving, onFieldChange, onRatingChange, onDelete, allTags, uploadImage }) {
  const [name, setName] = useState(entry.name);
  const [address, setAddress] = useState(entry.address || '');
  const [desc, setDesc] = useState(entry.description || '');

  useEffect(() => { setName(entry.name); }, [entry.name]);
  useEffect(() => { setAddress(entry.address || ''); }, [entry.address]);
  useEffect(() => { setDesc(entry.description || ''); }, [entry.description]);

  return (
    <tr className="manage-row">
      <td>
        <InlineSelect
          value={entry.status || 'bucket-list'}
          options={STATUS_OPTS}
          onChange={(v) => onFieldChange(entry.id, 'status', v)}
          className={entry.status === 'visited' ? 'status-visited' : 'status-bucket'}
        />
      </td>
      <td>
        <ExistingImageCell entry={entry} uploadImage={uploadImage} onFieldChange={onFieldChange} />
      </td>
      <td>
        <input
          className="manage-input manage-input-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { if (name !== entry.name) onFieldChange(entry.id, 'name', name); }}
        />
      </td>
      <td className="manage-location-cell">
        <span className="manage-location">{entry._cityName}</span>
        <span className="manage-location-sub">{entry._countryName}</span>
      </td>
      <td><span className="manage-section-badge">{entry._section}</span></td>
      <td>
        <input
          className="manage-input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => { if (address !== (entry.address || '')) onFieldChange(entry.id, 'address', address); }}
          placeholder="—"
        />
      </td>
      <td>
        <TagCell tags={entry.tags || []} allTags={allTags} onChange={(v) => onFieldChange(entry.id, 'tags', v)} />
      </td>
      <td>
        <InlineSelect
          value={entry.repeatability || ''}
          options={[{ value: '', label: '—' }, ...RECOMMENDATION_OPTIONS.map((o) => ({ value: o, label: o }))]}
          onChange={(v) => onFieldChange(entry.id, 'repeatability', v)}
        />
      </td>
      <td><RatingInput value={entry.rating?.taste || 0} onChange={(v) => onRatingChange(entry.id, entry, 'taste', v)} /></td>
      <td><RatingInput value={entry.rating?.value || 0} onChange={(v) => onRatingChange(entry.id, entry, 'value', v)} /></td>
      <td><RatingInput value={entry.rating?.experience || 0} onChange={(v) => onRatingChange(entry.id, entry, 'experience', v)} /></td>
      <td>
        <input
          className="manage-input"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => { if (desc !== (entry.description || '')) onFieldChange(entry.id, 'description', desc); }}
          placeholder="—"
        />
      </td>
      <td className="manage-actions-cell">
        <div className="manage-actions-inner">
          {saving && <FiLoader size={11} className="spinner" style={{ color: 'var(--accent)' }} />}
          <button className="manage-action-btn manage-delete-btn" onClick={() => onDelete(entry.id, entry.name)} title="Delete">
            <FiTrash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}
