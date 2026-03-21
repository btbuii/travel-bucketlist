import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import defaultData, { SECTION_TYPES } from '../data/defaultData';
import { v4 as uuidv4 } from 'uuid';
import resizeImage from '../lib/imageResize';

function buildNestedData(countries, cities, entries) {
  const countryMap = new Map();

  for (const c of countries) {
    countryMap.set(c.id, {
      id: c.id,
      name: c.name,
      code: c.code || '',
      description: c.description || '',
      personal_description: c.personal_description || '',
      notes: c.notes || '',
      trips: c.trips || 0,
      visited: !!c.visited,
      gallery: (c.gallery || []).map((g) => {
        if (typeof g === 'string' && g.startsWith('{')) {
          try { return JSON.parse(g); } catch (e) { /* fall through */ }
        }
        if (typeof g === 'object' && g !== null) return g;
        return { url: g, caption: '' };
      }),
      banner: c.banner || '',
      cities: []
    });
  }

  const cityMap = new Map();
  for (const city of cities) {
    const sections = {};
    SECTION_TYPES.forEach((s) => { sections[s] = []; });
    const cityObj = { id: city.id, name: city.name, description: city.description || '', visited: !!city.visited, latitude: city.latitude || null, longitude: city.longitude || null, custom_tags: city.custom_tags || null, sections };
    cityMap.set(city.id, cityObj);
    const country = countryMap.get(city.country_id);
    if (country) country.cities.push(cityObj);
  }

  for (const e of entries) {
    const city = cityMap.get(e.city_id);
    if (!city) continue;
    let section = e.section;
    if (section === 'Attraction') section = 'Attractions';
    if (section === 'Sights') section = 'Hotels';
    if (!city.sections[section]) city.sections[section] = [];
    const imgs = Array.isArray(e.images) && e.images.length > 0 ? [...e.images] : [];
    if (e.image && !imgs.includes(e.image)) imgs.unshift(e.image);
    city.sections[section].push({
      id: e.id,
      name: e.name,
      address: e.address || '',
      image: imgs[0] || '',
      images: imgs,
      rating: {
        taste: e.rating_taste || 0,
        value: e.rating_value || 0,
        experience: e.rating_experience || 0
      },
      tags: e.tags || [],
      repeatability: e.repeatability || '',
      description: e.description || '',
      status: e.status || 'bucket-list',
      latitude: e.latitude || null,
      longitude: e.longitude || null,
      createdAt: e.created_at
    });
  }

  return { countries: Array.from(countryMap.values()) };
}

export default function useData(userId) {
  const [data, setData] = useState({ countries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pendingWritesRef = useRef(0);
  const initialLoadDone = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('travel-bucketlist');
      setData(stored ? JSON.parse(stored) : defaultData);
      setLoading(false);
      initialLoadDone.current = true;
      return;
    }

    if (!userId) {
      setData({ countries: [] });
      setLoading(false);
      return;
    }

    if (initialLoadDone.current && pendingWritesRef.current > 0) {
      return;
    }

    try {
      setError(null);
      const [countriesRes, citiesRes, entriesRes] = await Promise.all([
        supabase.from('countries').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('cities').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('entries').select('*').eq('user_id', userId).order('created_at')
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (citiesRes.error) throw citiesRes.error;
      if (entriesRes.error) throw entriesRes.error;

      if (pendingWritesRef.current === 0) {
        setData(buildNestedData(countriesRes.data, citiesRes.data, entriesRes.data));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const backfillRan = useRef(false);
  useEffect(() => {
    if (!isSupabaseConfigured || !userId || loading || data.countries.length === 0) return;
    if (backfillRan.current) return;

    const missing = [];
    for (const country of data.countries) {
      for (const city of country.cities) {
        if (!city.latitude && !city.longitude) missing.push({ id: city.id, name: city.name, countryName: country.name });
      }
    }
    if (missing.length === 0) { backfillRan.current = true; return; }
    backfillRan.current = true;

    (async () => {
      console.log('[geocode-backfill] Starting for', missing.length, 'cities/states');
      let updated = false;
      for (const item of missing) {
        try {
          const q = encodeURIComponent(`${item.name}, ${item.countryName}`);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`, { headers: { Accept: 'application/json' } });
          const geo = await res.json();
          if (geo?.[0]) {
            const { error } = await supabase.from('cities').update({ latitude: parseFloat(geo[0].lat), longitude: parseFloat(geo[0].lon) }).eq('id', item.id);
            if (error) {
              console.warn('[geocode-backfill] DB update failed for', item.name, error.message);
            } else {
              console.log('[geocode-backfill] Pinned', item.name, geo[0].lat, geo[0].lon);
              updated = true;
            }
          } else {
            console.warn('[geocode-backfill] No results for', item.name);
          }
          await new Promise((r) => setTimeout(r, 1100));
        } catch (e) { console.warn('[geocode-backfill] Error for', item.name, e); }
      }
      if (updated && pendingWritesRef.current === 0) fetchAll();
    })();
  }, [data.countries, loading, userId, fetchAll]);

  async function addCountry({ name, code, banner, description }) {
    const id = uuidv4();
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.countries.push({ id, name, code: code || '', description: description || '', personal_description: '', notes: '', trips: 0, visited: false, gallery: [], banner: banner || '', cities: [] });
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return id;
    pendingWritesRef.current++;
    try {
      const maxOrder = data.countries.length;
      const { error } = await supabase.from('countries').insert({
        id, name, flag: '🌍', code: code || '', description: description || '',
        banner: banner || '', sort_order: maxOrder, user_id: userId
      });
      if (error) throw error;
    } catch (err) {
      console.error('addCountry failed, reverting:', err);
      pendingWritesRef.current--;
      await fetchAll();
      throw err;
    }
    pendingWritesRef.current--;
    return id;
  }

  async function removeCountry(countryId) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.countries = next.countries.filter((c) => c.id !== countryId);
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    try {
      const { error } = await supabase.from('countries').delete().eq('id', countryId);
      if (error) throw error;
    } catch (err) {
      console.error('removeCountry failed, reverting:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function updateCountryField(countryId, field, value) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const country = next.countries.find((c) => c.id === countryId);
      if (country) country[field] = value;
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    try {
      const { error } = await supabase.from('countries').update({ [field]: value }).eq('id', countryId);
      if (error) throw error;
    } catch (err) {
      console.error('updateCountryField failed:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function addCity(countryId, cityName) {
    const id = uuidv4();
    const sections = {};
    SECTION_TYPES.forEach((s) => { sections[s] = []; });
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const country = next.countries.find((c) => c.id === countryId);
      if (!country) return prev;
      country.cities.push({ id, name: cityName, description: '', visited: false, latitude: null, longitude: null, custom_tags: null, sections });
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return id;
    pendingWritesRef.current++;
    try {
      const country = data.countries.find((c) => c.id === countryId);
      const maxOrder = country ? country.cities.length : 0;
      const row = { id, country_id: countryId, name: cityName, sort_order: maxOrder, user_id: userId };

      try {
        const geoQuery = cityName + (country ? ', ' + country.name : '');
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(geoQuery)}&limit=1`, { headers: { Accept: 'application/json' } });
        const geoData = await geoRes.json();
        if (geoData?.[0]) {
          row.latitude = parseFloat(geoData[0].lat);
          row.longitude = parseFloat(geoData[0].lon);
          setData((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            for (const c of next.countries) {
              const city = c.cities.find((ci) => ci.id === id);
              if (city) { city.latitude = row.latitude; city.longitude = row.longitude; break; }
            }
            return next;
          });
        }
      } catch (e) { console.warn('[addCity] Geocoding error:', e); }

      const { error } = await supabase.from('cities').insert(row);
      if (error) throw error;
    } catch (err) {
      console.error('addCity failed, reverting:', err);
      pendingWritesRef.current--;
      await fetchAll();
      throw err;
    }
    pendingWritesRef.current--;
    return id;
  }

  async function removeCity(cityId) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const country of next.countries) {
        country.cities = country.cities.filter((c) => c.id !== cityId);
      }
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    try {
      const { error } = await supabase.from('cities').delete().eq('id', cityId);
      if (error) throw error;
    } catch (err) {
      console.error('removeCity failed:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function reorderCities(countryId, orderedIds) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const country = next.countries.find((c) => c.id === countryId);
      if (country) {
        const cityMap = new Map(country.cities.map((c) => [c.id, c]));
        country.cities = orderedIds.map((id) => cityMap.get(id)).filter(Boolean);
      }
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    try {
      const updates = orderedIds.map((id, i) =>
        supabase.from('cities').update({ sort_order: i }).eq('id', id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error('reorderCities failed:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function updateCityField(cityId, field, value) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const country of next.countries) {
        const city = country.cities.find((c) => c.id === cityId);
        if (city) { city[field] = value; break; }
      }
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    try {
      const { error } = await supabase.from('cities').update({ [field]: value }).eq('id', cityId);
      if (error) throw error;
    } catch (err) {
      console.error('updateCityField failed:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function addEntry(cityId, section, entryData) {
    const optimisticEntry = {
      id: entryData.id || uuidv4(),
      name: entryData.name,
      address: entryData.address || '',
      image: entryData.images?.[0] || entryData.image || '',
      images: entryData.images || [],
      rating: entryData.rating || { taste: 0, value: 0, experience: 0 },
      tags: entryData.tags || [],
      repeatability: entryData.repeatability || '',
      description: entryData.description || '',
      status: entryData.status || 'bucket-list',
      latitude: entryData.latitude || null,
      longitude: entryData.longitude || null,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const country of next.countries) {
        const city = country.cities.find((c) => c.id === cityId);
        if (city) {
          if (!city.sections[section]) city.sections[section] = [];
          city.sections[section].push(optimisticEntry);
          break;
        }
      }
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    try {
      const baseRow = {
        city_id: cityId,
        section,
        name: entryData.name,
        address: entryData.address || '',
        image: entryData.images?.[0] || entryData.image || '',
        rating_taste: entryData.rating?.taste || 0,
        rating_value: entryData.rating?.value || 0,
        rating_experience: entryData.rating?.experience || 0,
        tags: entryData.tags || [],
        description: entryData.description || '',
        user_id: userId,
      };
      const extras = {};
      if (entryData.status) extras.status = entryData.status;
      if (entryData.repeatability) extras.repeatability = entryData.repeatability;
      if (entryData.latitude != null) extras.latitude = entryData.latitude;
      if (entryData.longitude != null) extras.longitude = entryData.longitude;
      if (entryData.images?.length) extras.images = entryData.images;

      let { error } = await supabase.from('entries').insert({ ...baseRow, ...extras });
      if (error && error.message?.includes('schema cache')) {
        ({ error } = await supabase.from('entries').insert(baseRow));
      }
      if (error) throw error;
    } catch (err) {
      console.error('addEntry failed:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function deleteEntry(entryId) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const country of next.countries) {
        for (const city of country.cities) {
          for (const section of SECTION_TYPES) {
            if (city.sections[section]) {
              city.sections[section] = city.sections[section].filter((e) => e.id !== entryId);
            }
          }
        }
      }
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    try {
      const { error } = await supabase.from('entries').delete().eq('id', entryId);
      if (error) throw error;
    } catch (err) {
      console.error('deleteEntry failed:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function updateEntry(entryId, entryData) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const country of next.countries) {
        for (const city of country.cities) {
          for (const section of SECTION_TYPES) {
            const idx = city.sections[section]?.findIndex((e) => e.id === entryId);
            if (idx >= 0) {
              city.sections[section][idx] = { ...city.sections[section][idx], ...entryData };
              break;
            }
          }
        }
      }
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    const row = {};
    if (entryData.name != null) row.name = entryData.name;
    if (entryData.address != null) row.address = entryData.address;
    if (entryData.image != null) row.image = entryData.image;
    if (entryData.description != null) row.description = entryData.description;
    if (entryData.tags != null) row.tags = entryData.tags;
    if (entryData.repeatability != null) row.repeatability = entryData.repeatability;
    if (entryData.status != null) row.status = entryData.status;
    if (entryData.rating) {
      row.rating_taste = entryData.rating.taste || 0;
      row.rating_value = entryData.rating.value || 0;
      row.rating_experience = entryData.rating.experience || 0;
    }
    if (entryData.latitude != null) row.latitude = entryData.latitude;
    if (entryData.longitude != null) row.longitude = entryData.longitude;
    if (entryData.images != null) {
      row.images = entryData.images;
      row.image = entryData.images[0] || '';
    }
    try {
      const { error } = await supabase.from('entries').update(row).eq('id', entryId);
      if (error) throw error;
    } catch (err) {
      console.error('updateEntry failed:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function updateEntryStatus(entryId, newStatus) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const country of next.countries) {
        for (const city of country.cities) {
          for (const section of SECTION_TYPES) {
            const entry = city.sections[section]?.find((e) => e.id === entryId);
            if (entry) { entry.status = newStatus; break; }
          }
        }
      }
      if (!isSupabaseConfigured) localStorage.setItem('travel-bucketlist', JSON.stringify(next));
      return next;
    });
    if (!isSupabaseConfigured) return;
    pendingWritesRef.current++;
    try {
      const { error } = await supabase.from('entries').update({ status: newStatus }).eq('id', entryId);
      if (error) throw error;
    } catch (err) {
      console.error('updateEntryStatus failed:', err);
    } finally {
      pendingWritesRef.current--;
    }
  }

  async function uploadImage(file) {
    if (!isSupabaseConfigured) return URL.createObjectURL(file);
    const optimized = await resizeImage(file);
    const ext = optimized.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop();
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `uploads/${fileName}`;
    const { error } = await supabase.storage
      .from('entry-images')
      .upload(filePath, optimized, { cacheControl: '31536000', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('entry-images').getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  return {
    data, loading, error,
    addCountry, removeCountry, updateCountryField,
    addCity, removeCity, reorderCities, updateCityField,
    addEntry, updateEntry, deleteEntry,
    updateEntryStatus, uploadImage,
    refresh: fetchAll
  };
}
