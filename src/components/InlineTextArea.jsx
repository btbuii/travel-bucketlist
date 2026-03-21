import { useState, useEffect, useRef } from 'react';
import { FiCheck } from 'react-icons/fi';

export default function InlineTextArea({ value, onSave, placeholder, isAdmin, minRows = 3 }) {
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const isDirty = draft !== (value || '');

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft); }
    catch (err) { alert('Save failed: ' + err.message); }
    finally { setSaving(false); }
  };

  if (!isAdmin) {
    if (!value) return null;
    return <p className="inline-ta-text">{value}</p>;
  }

  return (
    <div className="inline-ta">
      <textarea
        ref={textRef}
        className="inline-ta-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        rows={minRows}
      />
      {isDirty && (
        <button className="inline-ta-save" onClick={handleSave} disabled={saving}>
          <FiCheck size={12} /> {saving ? 'Saving...' : 'Save'}
        </button>
      )}
    </div>
  );
}
