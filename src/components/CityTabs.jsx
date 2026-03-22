import { FiPlus, FiX, FiMenu } from 'react-icons/fi';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CityTabs({ cities, activeCity, onSelect, onAddCity, onRemoveCity, onReorder, cityLabel = 'City' }) {
  const { isAdmin } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [showFade, setShowFade] = useState(false);
  const scrollContainerRef = useRef(null);

  const checkOverflow = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowFade(el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => { checkOverflow(); }, [cities, checkOverflow]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await onAddCity(newName.trim());
      setNewName('');
      setShowAdd(false);
    } catch (err) {
      alert('Failed to add: ' + err.message);
    }
  };

  const handleDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      const reordered = [...cities];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(dragOverIdx, 0, moved);
      onReorder(reordered.map((c) => c.id));
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="city-tabs">
      {showFade && <div className="city-tabs-fade" />}
      <div className="city-tabs-scroll" ref={scrollContainerRef} onScroll={checkOverflow}>
        <button
          className={`city-tab ${activeCity === 'all' ? 'active' : ''}`}
          onClick={() => onSelect('all')}
        >
          All
        </button>
        {cities.map((city, i) => (
          <button
            key={city.id}
            className={`city-tab ${activeCity === city.id ? 'active' : ''} ${dragIdx === i ? 'dragging' : ''} ${dragOverIdx === i ? 'drag-over' : ''}`}
            onClick={() => onSelect(city.id)}
            draggable={isAdmin}
            onDragStart={() => setDragIdx(i)}
            onDragEnter={() => setDragOverIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
          >
            {isAdmin && <FiMenu size={10} className="drag-handle" />}
            {city.name}
            {isAdmin && (
              <span
                className="tab-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove ${city.name}?`)) onRemoveCity(city.id);
                }}
              >
                <FiX size={11} />
              </span>
            )}
          </button>
        ))}
        {isAdmin && (
          showAdd ? (
            <div className="inline-add">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`${cityLabel} name...`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setShowAdd(false); setNewName(''); }
                }}
              />
              <button className="icon-btn small" onClick={handleAdd}><FiPlus size={14} /></button>
              <button className="icon-btn small" onClick={() => { setShowAdd(false); setNewName(''); }}><FiX size={14} /></button>
            </div>
          ) : (
            <button className="city-tab add-tab" onClick={() => setShowAdd(true)}>
              <FiPlus size={12} /> Add {cityLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}
