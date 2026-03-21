import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchFilter({ search, onSearchChange, statusFilter, onStatusChange }) {
  return (
    <div className="search-filter">
      <div className="search-box">
        <FiSearch size={15} className="search-icon" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search entries..."
        />
        {search && (
          <button className="search-clear" onClick={() => onSearchChange('')}>
            <FiX size={14} />
          </button>
        )}
      </div>
      <div className="status-filter">
        {['all', 'visited', 'bucket-list'].map((s) => (
          <button
            key={s}
            className={`status-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => onStatusChange(s)}
          >
            {s === 'all' ? 'All' : s === 'visited' ? 'Been Here' : 'Want to Go'}
          </button>
        ))}
      </div>
    </div>
  );
}
