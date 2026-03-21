export const TAG_OPTIONS = [
  'Street Food', 'Fine Dining', 'Café', 'Bar', 'Buffet', 'Bakery',
  'Market', 'Shopping', 'Temple', 'Beach', 'Nature', 'Park',
  'Nightlife', 'Museum', 'Historical', 'Adventure', 'Relaxation',
  'Photography', 'Local Experience', 'Must Visit', 'Hidden Gem',
  'Family Friendly', 'Romantic', 'Scenic View', 'Cultural',
  'Waterfront', 'Rooftop', 'Spa', 'Festival', 'Architecture'
];

export const SECTION_TYPES = ['Food', 'Attractions', 'Hotels'];

export const RECOMMENDATION_OPTIONS = [
  'Absolute Must',
  'If Convenient',
  'Worth Going Once',
  'Skip'
];

export const STATUS_OPTIONS = [
  { value: 'visited', label: 'Been Here' },
  { value: 'bucket-list', label: 'Want to Go' }
];

export const FLAG_CODES = {
  thailand: 'th',
  usa: 'us',
  vietnam: 'vn',
  china: 'cn',
  japan: 'jp',
  singapore: 'sg',
};

export function getFlagUrl(countryIdOrCode) {
  const code = FLAG_CODES[countryIdOrCode] || countryIdOrCode;
  if (!code || code.length !== 2) return null;
  return `https://flagpedia.net/data/flags/w580/${code}.webp`;
}

const defaultData = {
  countries: [
    {
      id: 'usa',
      name: 'USA',
      code: 'us',
      description: 'From NYC skylines to California sunsets — my American adventures and bucket list.',
      banner: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600&q=80',
      cities: [
        { id: 'california', name: 'California', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'new-york', name: 'New York', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'oregon', name: 'Oregon', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'boston', name: 'Boston', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'hawaii', name: 'Hawaii', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'texas', name: 'Texas', sections: { Food: [], Attractions: [], Hotels: [] } }
      ]
    },
    {
      id: 'thailand',
      name: 'Thailand',
      code: 'th',
      description: 'Golden temples, night markets, and the best street food on earth.',
      banner: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1600&q=80',
      cities: [
        { id: 'bangkok', name: 'Bangkok', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'chiang-mai', name: 'Chiang Mai', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'pattaya', name: 'Pattaya', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'phuket', name: 'Phuket', sections: { Food: [], Attractions: [], Hotels: [] } }
      ]
    },
    {
      id: 'vietnam',
      name: 'Vietnam',
      code: 'vn',
      description: 'Ancient lanterns, endless bowls of pho, and island paradise.',
      banner: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80',
      cities: [
        { id: 'ho-chi-minh', name: 'Ho Chi Minh City', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'hoi-an', name: 'Hoi An', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'phu-quoc', name: 'Phu Quoc', sections: { Food: [], Attractions: [], Hotels: [] } }
      ]
    },
    {
      id: 'china',
      name: 'China',
      code: 'cn',
      description: 'Sizzling hotpot, neon-lit megacities, and centuries of history.',
      banner: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1600&q=80',
      cities: [
        { id: 'chongqing', name: 'Chongqing', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'shanghai', name: 'Shanghai', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'hong-kong', name: 'Hong Kong', sections: { Food: [], Attractions: [], Hotels: [] } }
      ]
    },
    {
      id: 'japan',
      name: 'Japan',
      code: 'jp',
      description: 'Ramen runs, cherry blossoms, and the perfect blend of old and new.',
      banner: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80',
      cities: [
        { id: 'tokyo', name: 'Tokyo', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'shibuya', name: 'Shibuya', sections: { Food: [], Attractions: [], Hotels: [] } },
        { id: 'osaka', name: 'Osaka', sections: { Food: [], Attractions: [], Hotels: [] } }
      ]
    },
    {
      id: 'singapore',
      name: 'Singapore',
      code: 'sg',
      description: 'Hawker heaven, futuristic gardens, and the cleanest streets I\'ve walked.',
      banner: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&q=80',
      cities: [
        { id: 'singapore-city', name: 'Singapore City', sections: { Food: [], Attractions: [], Hotels: [] } }
      ]
    }
  ]
};

export default defaultData;
