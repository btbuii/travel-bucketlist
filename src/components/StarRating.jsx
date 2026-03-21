import { useState } from 'react';

function StarIcon({ fill, size }) {
  const full = '#eab308';
  const empty = '#d4d4d8';

  if (fill === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={full} stroke={full} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (fill === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={empty} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id={`half-${size}`}>
          <stop offset="50%" stopColor={full} />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={`url(#half-${size})`}
        stroke={full}
      />
    </svg>
  );
}

export function StarDisplay({ value, size = 15 }) {
  return (
    <span className="rating-stars">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        return <StarIcon key={i} fill={fill} size={size} />;
      })}
    </span>
  );
}

export function StarInput({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  const calc = (i, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return (e.clientX - rect.left) < rect.width / 2 ? i - 0.5 : i;
  };

  return (
    <div className="star-input-group">
      <label>{label}</label>
      <div className="star-input">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = display >= i ? 1 : display >= i - 0.5 ? 0.5 : 0;
          return (
            <span
              key={i}
              className="star-interactive-wrapper"
              onMouseMove={(e) => setHover(calc(i, e))}
              onMouseLeave={() => setHover(0)}
              onClick={(e) => onChange(calc(i, e))}
            >
              <StarIcon fill={fill} size={18} />
            </span>
          );
        })}
      </div>
    </div>
  );
}
