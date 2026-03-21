import { FiPlus, FiCamera, FiUpload } from 'react-icons/fi';
import { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import COUNTRIES from '../data/countries';

export default function CountryBanners({ countries, onSelect, onAddCountry, onUpdateBanner, uploadImage }) {
  const { isAdmin } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [newDesc, setNewDesc] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [adding, setAdding] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const addBannerRef = useRef(null);
  const fileRefs = useRef({});
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    const list = q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)) : COUNTRIES;
    return list;
  }, [countrySearch]);

  const handleSelectCountryOption = (c) => {
    setSelectedCountry(c);
    setCountrySearch(c.name);
    setDropdownOpen(false);
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleAdd = async () => {
    if (!selectedCountry) return;
    setAdding(true);
    try {
      let bannerUrl = '';
      if (bannerFile && uploadImage) {
        bannerUrl = await uploadImage(bannerFile);
      }
      await onAddCountry({
        name: selectedCountry.name,
        code: selectedCountry.code,
        banner: bannerUrl,
        description: newDesc.trim()
      });
      resetAddForm();
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setAdding(false); }
  };

  const resetAddForm = () => {
    setSelectedCountry(null);
    setCountrySearch('');
    setNewDesc('');
    setBannerFile(null);
    setBannerPreview('');
    setAddOpen(false);
    setDropdownOpen(false);
  };

  const handleBannerUpload = async (countryId, e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadImage || !onUpdateBanner) return;
    try {
      const url = await uploadImage(file);
      await onUpdateBanner(countryId, url);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  return (
    <section className="banners-section">
      <div className="banners-row">
        {countries.map((c) => (
          <div
            key={c.id}
            className="banner-col"
            style={c.banner ? { backgroundImage: `url(${c.banner})` } : undefined}
            onClick={() => onSelect(c.id)}
          >
            <div className="banner-overlay" />
            <div className="banner-content">
              <h3 className="banner-name">{c.name}</h3>
              <p className="banner-desc">{c.description}</p>
            </div>
            {isAdmin && uploadImage && (
              <button
                className="banner-upload-btn"
                onClick={(ev) => { ev.stopPropagation(); fileRefs.current[c.id]?.click(); }}
                title="Change banner image"
              >
                <FiCamera size={14} />
              </button>
            )}
            <input
              ref={(el) => { fileRefs.current[c.id] = el; }}
              type="file"
              accept="image/*"
              hidden
              onChange={(ev) => handleBannerUpload(c.id, ev)}
            />
          </div>
        ))}
        {isAdmin && (
          <div className="banner-col banner-add" onClick={() => setAddOpen(true)}>
            <div className="banner-overlay" />
            <div className="banner-content">
              <FiPlus size={24} />
              <h3 className="banner-name">Add Country</h3>
            </div>
          </div>
        )}
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={resetAddForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Country</h2>
              <button className="icon-btn" onClick={resetAddForm}><FiPlus style={{ transform: 'rotate(45deg)' }} /></button>
            </div>

            <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
              <label>Country *</label>
              <input
                value={countrySearch}
                onChange={(e) => { setCountrySearch(e.target.value); setSelectedCountry(null); setDropdownOpen(true); }}
                placeholder="Search for a country..."
                autoFocus
              />
              {dropdownOpen && !selectedCountry && filteredCountries.length > 0 && (
                <div className="country-dropdown">
                  {filteredCountries.map((c) => (
                    <div key={c.code} className="country-dropdown-item" onClick={() => handleSelectCountryOption(c)}>
                      <img src={`https://flagpedia.net/data/flags/w580/${c.code}.webp`} alt="" className="country-dropdown-flag" loading="lazy" />
                      <span>{c.name}</span>
                      <span className="country-dropdown-code">{c.code.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Banner Image</label>
              <div className="banner-upload-area" onClick={() => addBannerRef.current?.click()}>
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Preview" className="banner-upload-preview" />
                ) : (
                  <div className="banner-upload-placeholder">
                    <FiUpload size={18} />
                    <span>Click to upload a banner image</span>
                  </div>
                )}
              </div>
              <input ref={addBannerRef} type="file" accept="image/*" hidden onChange={handleBannerFileChange} />
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Description</label>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short description" />
            </div>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={resetAddForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!selectedCountry || adding}>
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
