import { useState, useRef, useCallback } from 'react';
import { FiPlus, FiX, FiChevronLeft, FiChevronRight, FiEdit2, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function PhotoGallery({ images, onAdd, onRemove, onUpdateCaption }) {
  const { isAdmin } = useAuth();
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [captionPrompt, setCaptionPrompt] = useState(null);
  const [editingCaption, setEditingCaption] = useState(null);
  const [captionDraft, setCaptionDraft] = useState('');

  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false, prevX: 0, velocity: 0, ts: 0, raf: 0 });

  const handlePointerDown = useCallback((e) => {
    if (!scrollRef.current) return;
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'button' || tag === 'input' || e.target.closest('button') || e.target.closest('input') || e.target.closest('.gallery-caption-editor')) return;
    cancelAnimationFrame(dragState.current.raf);
    dragState.current = { active: true, startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft, moved: false, prevX: e.clientX, velocity: 0, ts: Date.now(), raf: 0 };
    scrollRef.current.setPointerCapture(e.pointerId);
    scrollRef.current.style.cursor = 'grabbing';
  }, []);

  const handlePointerMove = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.active || !scrollRef.current) return;
    e.preventDefault();
    const now = Date.now();
    const dt = Math.max(now - ds.ts, 1);
    const dx = e.clientX - ds.startX;
    ds.velocity = (e.clientX - ds.prevX) / dt;
    ds.prevX = e.clientX;
    ds.ts = now;
    if (Math.abs(dx) > 3) ds.moved = true;
    scrollRef.current.scrollLeft = ds.scrollLeft - dx;
  }, []);

  const handlePointerUp = useCallback((e) => {
    const ds = dragState.current;
    ds.active = false;
    if (!scrollRef.current) return;
    scrollRef.current.releasePointerCapture(e.pointerId);
    scrollRef.current.style.cursor = 'grab';
    let v = -ds.velocity * 16;
    const coast = () => {
      if (Math.abs(v) < 0.3 || !scrollRef.current) return;
      scrollRef.current.scrollLeft += v;
      v *= 0.94;
      ds.raf = requestAnimationFrame(coast);
    };
    ds.raf = requestAnimationFrame(coast);
  }, []);

  if (!images?.length && !isAdmin) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onAdd) return;
    if (fileRef.current) fileRef.current.value = '';
    setCaptionPrompt({ file, caption: '' });
  };

  const confirmUpload = async () => {
    if (!captionPrompt) return;
    setUploading(true);
    try { await onAdd(captionPrompt.file, captionPrompt.caption); }
    catch (err) { alert('Upload failed: ' + err.message); }
    finally { setUploading(false); setCaptionPrompt(null); }
  };

  const startEditCaption = (i, current) => {
    setCaptionDraft(current || '');
    setEditingCaption(i);
  };

  const saveCaption = async (i) => {
    try {
      if (onUpdateCaption) await onUpdateCaption(i, captionDraft);
    } catch (err) {
      alert('Failed to save caption: ' + err.message);
    }
    setEditingCaption(null);
  };

  return (
    <div className="gallery-section">
      <div className="gallery-controls">
        <button className="gallery-arrow" onClick={() => scroll(-1)}><FiChevronLeft size={16} /></button>
        <button className="gallery-arrow" onClick={() => scroll(1)}><FiChevronRight size={16} /></button>
      </div>
      <div
        className="gallery-track"
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: 'grab', touchAction: 'pan-y' }}
      >
        {(images || []).map((item, i) => {
          const url = typeof item === 'string' ? item : item.url;
          const caption = typeof item === 'string' ? '' : (item.caption || '');
          return (
            <div key={i} className="gallery-item" onClick={(e) => { if (dragState.current.moved) e.stopPropagation(); }}>
              <img src={url} alt={caption} loading="lazy" draggable={false} />
              {caption && editingCaption !== i && (
                <span className="gallery-caption">{caption}</span>
              )}
              {isAdmin && !caption && editingCaption !== i && (
                <button className="gallery-caption-add" onClick={() => startEditCaption(i, caption)}><FiEdit2 size={10} /> caption</button>
              )}
              {isAdmin && caption && editingCaption !== i && (
                <button className="gallery-caption-edit" onClick={() => startEditCaption(i, caption)}><FiEdit2 size={9} /></button>
              )}
              {editingCaption === i && (
                <div className="gallery-caption-editor" onClick={(e) => e.stopPropagation()}>
                  <input value={captionDraft} onChange={(e) => setCaptionDraft(e.target.value)} placeholder="Caption..." autoFocus onKeyDown={(e) => e.key === 'Enter' && saveCaption(i)} />
                  <button onClick={() => saveCaption(i)}><FiCheck size={12} /></button>
                  <button onClick={() => setEditingCaption(null)}><FiX size={12} /></button>
                </div>
              )}
              {isAdmin && (
                <button className="gallery-remove" onClick={() => onRemove(i)}><FiX size={12} /></button>
              )}
            </div>
          );
        })}
        {isAdmin && (
          <div className="gallery-item gallery-add" onClick={() => !uploading && fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
            {uploading ? <span className="gallery-uploading">Uploading...</span> : <FiPlus size={24} />}
          </div>
        )}
      </div>
      {captionPrompt && (
        <div className="gallery-upload-prompt">
          <input
            value={captionPrompt.caption}
            onChange={(e) => setCaptionPrompt((p) => ({ ...p, caption: e.target.value }))}
            placeholder="Add a caption (optional)..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && confirmUpload()}
          />
          <button className="btn btn-primary btn-sm" onClick={confirmUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCaptionPrompt(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
