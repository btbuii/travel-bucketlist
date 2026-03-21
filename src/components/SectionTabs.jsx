import { FiGrid, FiCoffee, FiStar, FiHome } from 'react-icons/fi';
import { SECTION_TYPES } from '../data/defaultData';

const SECTION_ICONS = {
  All: FiGrid,
  Food: FiCoffee,
  Attractions: FiStar,
  Hotels: FiHome
};

const ALL_SECTIONS = ['All', ...SECTION_TYPES];

export default function SectionTabs({ activeSection, onSelect }) {
  return (
    <div className="section-tabs">
      {ALL_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section] || FiStar;
        return (
          <button
            key={section}
            className={`section-tab ${activeSection === section ? 'active' : ''}`}
            onClick={() => onSelect(section)}
          >
            <Icon size={14} />
            <span>{section}</span>
          </button>
        );
      })}
    </div>
  );
}
