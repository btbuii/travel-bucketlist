import { FiMapPin, FiTrash2, FiCheck, FiBookmark } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { StarDisplay } from './StarRating';

export default function EntryCard({ entry, onClick, onDelete, cityName }) {
  const { isAdmin } = useAuth();
  const avgRating = Math.round(
    ((entry.rating?.taste || 0) + (entry.rating?.value || 0) + (entry.rating?.experience || 0)) / 3 * 2
  ) / 2;
  const isVisited = entry.status === 'visited';
  const imgSrc = entry.images?.[0] || entry.image;

  return (
    <div className="entry-card" onClick={() => onClick(entry)}>
      <div className="card-image">
        {imgSrc ? (
          <img src={imgSrc} alt={entry.name} loading="lazy" />
        ) : (
          <div className="card-placeholder"><FiMapPin size={28} /></div>
        )}
        <div className="card-overlay">
          <span className={`status-badge ${isVisited ? 'visited' : 'bucket'}`}>
            {isVisited ? <><FiCheck size={10} /> Been Here</> : <><FiBookmark size={10} /> Want to Go</>}
          </span>
        </div>
        {(entry.tags || []).length > 0 && (
          <div className="card-tags-strip">
            {entry.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
            {entry.tags.length > 2 && <span className="tag-chip muted">+{entry.tags.length - 2}</span>}
          </div>
        )}
      </div>
      <div className="card-body">
        {cityName && <span className="card-city-label">{cityName}</span>}
        <h3 className="card-title">{entry.name}</h3>
        {entry.address && (
          <p className="card-address"><FiMapPin size={11} /> {entry.address}</p>
        )}
        <div className="card-footer">
          <StarDisplay value={avgRating} size={11} />
          {isAdmin && (
            <button
              className="icon-btn danger small"
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${entry.name}"?`)) onDelete(entry.id); }}
            >
              <FiTrash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
