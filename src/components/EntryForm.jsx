import { useState, useRef } from 'react';
import { FiX, FiUpload, FiImage, FiCheck, FiBookmark, FiSearch } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import { TAG_OPTIONS, SECTION_TYPES, RECOMMENDATION_OPTIONS } from '../data/defaultData';
import { StarInput } from './StarRating';

async function geocodeAddress(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
    { headers: { Accept: 'application/json' } }
  );
  const data = await res.json();
  if (data?.[0]) return { lat: data[0].lat, lng: data[0].lon };
  return null;
}

export default function EntryForm({ onSubmit, onClose, uploadImage, initialData, defaultSection, cityName, tagOptions }) {
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [section, setSection] = useState(defaultSection || SECTION_TYPES[0]);

  const initImages = initialData?.images?.length
    ? initialData.images.map((u) => ({ url: u }))
    : initialData?.image
      ? [{ url: initialData.image }]
      : [];
  const [images, setImages] = useState(initImages);
  const [imageMode, setImageMode] = useState('upload');
  const [tempUrl, setTempUrl] = useState('');

  const [taste, setTaste] = useState(initialData?.rating?.taste || 0);
  const [value, setValue] = useState(initialData?.rating?.value || 0);
  const [experience, setExperience] = useState(initialData?.rating?.experience || 0);
  const [tags, setTags] = useState(initialData?.tags || []);
  const [repeatability, setRepeatability] = useState(initialData?.repeatability || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || 'bucket-list');
  const [lat, setLat] = useState(initialData?.latitude != null ? String(initialData.latitude) : '');
  const [lng, setLng] = useState(initialData?.longitude != null ? String(initialData.longitude) : '');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const toggleTag = (tag) => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newEntries = files.map((f) => ({ url: URL.createObjectURL(f), file: f }));
    setImages((prev) => [...prev, ...newEntries]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addImageUrl = () => {
    if (tempUrl.trim()) {
      setImages((prev) => [...prev, { url: tempUrl.trim() }]);
      setTempUrl('');
    }
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleGeocode = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setLat(result.lat);
        setLng(result.lng);
      } else {
        setError('Address not found. Try a more specific address.');
        setTimeout(() => setError(''), 3000);
      }
    } catch {
      setError('Geocoding failed.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const finalUrls = [];
      for (const img of images) {
        if (img.file && uploadImage) {
          const url = await uploadImage(img.file);
          finalUrls.push(url);
        } else {
          finalUrls.push(img.url);
        }
      }

      const entry = {
        id: initialData?.id || uuidv4(),
        name: name.trim(),
        address: address.trim(),
        image: finalUrls[0] || '',
        images: finalUrls,
        rating: { taste, value, experience },
        tags,
        repeatability: repeatability || '',
        description: description.trim(),
        status,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        ...(!isEdit && { _section: section }),
      };
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        entry.latitude = parsedLat;
        entry.longitude = parsedLng;
      }
      await onSubmit(entry);
      onClose();
    } catch (err) {
      setError('Failed to save: ' + (err.message || 'Unknown error'));
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Entry' : `Add New Entry${cityName ? ` for ${cityName}` : ''}`}</h2>
          <button className="icon-btn" onClick={onClose}><FiX /></button>
        </div>

        {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label>Status</label>
            <div className="status-selector">
              <button type="button" className={`status-opt ${status === 'visited' ? 'active visited' : ''}`} onClick={() => setStatus('visited')}>
                <FiCheck size={13} /> Been Here
              </button>
              <button type="button" className={`status-opt ${status === 'bucket-list' ? 'active bucket' : ''}`} onClick={() => setStatus('bucket-list')}>
                <FiBookmark size={13} /> Want to Go
              </button>
            </div>
          </div>

          {!isEdit && (
            <div className="form-group">
              <label>Category</label>
              <div className="status-selector">
                {SECTION_TYPES.map((s) => (
                  <button key={s} type="button" className={`status-opt ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chatuchak Weekend Market" autoFocus required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 587/10 Kamphaeng Phet 2 Rd" />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Latitude</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 13.7563" type="number" step="any" />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 100.5018" type="number" step="any" />
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm geocode-btn" onClick={handleGeocode} disabled={!address.trim() || geocoding}>
            <FiSearch size={12} /> {geocoding ? 'Looking up...' : 'Lookup coordinates from address'}
          </button>

          <div className="form-group">
            <label>Images</label>
            {images.length > 0 && (
              <div className="form-images-grid">
                {images.map((img, i) => (
                  <div key={i} className="form-image-thumb">
                    <img src={img.url} alt="" loading="lazy" />
                    <button type="button" className="form-image-remove" onClick={() => removeImage(i)}><FiX size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="image-mode-toggle">
              <button type="button" className={`toggle-btn ${imageMode === 'upload' ? 'active' : ''}`} onClick={() => setImageMode('upload')}>
                <FiUpload size={12} /> Upload
              </button>
              <button type="button" className={`toggle-btn ${imageMode === 'url' ? 'active' : ''}`} onClick={() => setImageMode('url')}>
                <FiImage size={12} /> URL
              </button>
            </div>
            {imageMode === 'upload' ? (
              <div className="file-upload-area" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} hidden />
                <div className="upload-placeholder"><FiUpload size={20} /><span>Click to upload</span></div>
              </div>
            ) : (
              <div className="url-add-row">
                <input value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} placeholder="https://..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={addImageUrl} disabled={!tempUrl.trim()}>Add</button>
              </div>
            )}
          </div>

          <div className="form-row-3">
            <StarInput label={section === 'Food' ? 'Quality' : 'Convenience'} value={taste} onChange={setTaste} />
            <StarInput label="Value" value={value} onChange={setValue} />
            <StarInput label="Experience" value={experience} onChange={setExperience} />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-selector">
              <div className="tag-selector-trigger" onClick={() => setTagDropdownOpen(!tagDropdownOpen)}>
                {tags.length === 0 ? <span className="placeholder">Select tags...</span> : (
                  <div className="selected-tags">
                    {tags.map((tag) => (
                      <span key={tag} className="tag-chip small" onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}>{tag} <FiX size={9} /></span>
                    ))}
                  </div>
                )}
              </div>
              {tagDropdownOpen && (
                <div className="tag-dropdown">
                  {(tagOptions || TAG_OPTIONS).map((tag) => (
                    <label key={tag} className="tag-option">
                      <input type="checkbox" checked={tags.includes(tag)} onChange={() => toggleTag(tag)} />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Recommendation</label>
            <div className="status-selector repeatability-selector">
              {RECOMMENDATION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`status-opt${repeatability === opt ? ' active' : ''}`}
                  onClick={() => setRepeatability(repeatability === opt ? '' : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Your notes about this place..." rows={3} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
