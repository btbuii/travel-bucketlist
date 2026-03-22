import { useState } from 'react';
import { FiX, FiMapPin, FiCheck, FiBookmark, FiEdit2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { StarDisplay } from './StarRating';

function RatingRow({ label, value }) {
  return (
    <div className="detail-rating-row">
      <span className="detail-rating-label">{label}</span>
      <StarDisplay value={value} size={15} />
      <span className="detail-rating-value">{value}/5</span>
    </div>
  );
}

export default function EntryDetail({ entry, section, onClose, onToggleStatus, onEdit }) {
  const { isAdmin } = useAuth();
  const [imgIdx, setImgIdx] = useState(0);
  if (!entry) return null;

  const isVisited = entry.status === 'visited';
  const images = entry.images?.length ? entry.images : entry.image ? [entry.image] : [];

  const prev = () => setImgIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setImgIdx((i) => (i + 1) % images.length);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-inner">
          <button className="modal-close" onClick={onClose}><FiX size={18} /></button>

          {images.length > 0 && (
            <div className="detail-image-carousel">
              <img src={images[imgIdx]} alt={entry.name} loading="lazy" />
              {images.length > 1 && (
                <>
                  <button className="carousel-arrow carousel-prev" onClick={prev}><FiChevronLeft size={20} /></button>
                  <button className="carousel-arrow carousel-next" onClick={next}><FiChevronRight size={20} /></button>
                  <div className="carousel-dots">
                    {images.map((_, i) => (
                      <span key={i} className={`carousel-dot ${i === imgIdx ? 'active' : ''}`} onClick={() => setImgIdx(i)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="detail-content">
            <div className="detail-top">
              {isAdmin && onToggleStatus ? (
                <label className="visited-toggle" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isVisited}
                    onChange={() => onToggleStatus(entry.id, isVisited ? 'bucket-list' : 'visited')}
                  />
                  <span className="visited-slider" />
                  <span className={`visited-label ${isVisited ? 'visited-yes' : 'visited-no'}`}>
                    {isVisited ? 'Been Here' : 'Want to Go'}
                  </span>
                </label>
              ) : (
                <span className={`status-badge ${isVisited ? 'visited' : 'bucket'}`}>
                  {isVisited ? <><FiCheck size={11} /> Been Here</> : <><FiBookmark size={11} /> Want to Go</>}
                </span>
              )}
              {isAdmin && onEdit && (
                <button className="status-toggle-btn" onClick={() => onEdit(entry)} style={{ marginLeft: 'auto' }}>
                  <FiEdit2 size={11} style={{ marginRight: 4 }} /> Edit
                </button>
              )}
            </div>

            <h2 className="detail-title">{entry.name}</h2>

            {entry.address && (
              <p className="detail-address"><FiMapPin size={13} /> {entry.address}</p>
            )}

            {entry.description && (
              <div className="detail-description">
                <h4>Description</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{entry.description}</p>
              </div>
            )}

            {entry.repeatability && (
              <div className="detail-repeatability">
                <h4>Recommendation</h4>
                <span className="repeatability-badge">{entry.repeatability}</span>
              </div>
            )}

            {entry.tags?.length > 0 && (
              <div className="detail-tags">
                <h4>Tags</h4>
                <div className="detail-tags-list">
                  {entry.tags.map((tag) => <span key={tag} className="tag-chip">{tag}</span>)}
                </div>
              </div>
            )}

            <div className="detail-ratings">
              <h4>Ratings</h4>
              <RatingRow label={section === 'Food' ? 'Quality' : 'Convenience'} value={entry.rating?.taste || 0} />
              <RatingRow label="Value" value={entry.rating?.value || 0} />
              <RatingRow label="Experience" value={entry.rating?.experience || 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
