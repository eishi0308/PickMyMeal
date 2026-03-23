import { useState } from 'react';
import { recommend, generateImage, preloadImage } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';

const CATEGORIES = [
  {
    key: 'flavor',
    label: 'Flavor',
    options: ['Salty', 'Sweet', 'Savory', 'Sour', 'Any'],
  },
  {
    key: 'spice_level',
    label: 'Spice level',
    options: ['Not spicy', 'Mild', 'Spicy', 'Very spicy', 'Any'],
  },
  {
    key: 'temperature',
    label: 'Hot or cold?',
    options: ['Hot', 'Cold', 'Either'],
  },
  {
    key: 'fullness',
    label: 'How filling?',
    options: ['Light', 'Medium', 'Heavy', 'Any'],
  },
  {
    key: 'richness',
    label: 'Rich or fresh?',
    options: ['Rich', 'Fresh', 'In between', 'Any'],
  },
  {
    key: 'base',
    label: 'Base',
    options: ['Rice', 'Noodles', 'Bread', 'Any'],
  },
  {
    key: 'style',
    label: 'Style',
    options: ['Fried', 'Soup', 'Grilled', 'Fresh', 'Saucy', 'Any'],
  },
  {
    key: 'mood',
    label: 'What sounds good?',
    options: ['Healthy', 'Comfort', 'Treat', 'Balanced', 'Any'],
  },
  {
    key: 'protein',
    label: 'Protein',
    options: ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Any'],
  },
  {
    key: 'cuisine',
    label: 'Cuisine',
    options: ['Japanese', 'Korean', 'Chinese', 'Thai', 'Italian', 'Mexican', 'American', 'Any'],
  },
  {
    key: 'meal_type',
    label: 'Meal type',
    options: ['Quick', 'Full meal', 'Snack', 'Late night'],
  },
  {
    key: 'texture',
    label: 'Texture',
    options: ['Crispy', 'Soft', 'Chewy', 'Any'],
  },
  {
    key: 'portion',
    label: 'Portion',
    options: ['Just me', 'Sharing', 'Any'],
  },
];

interface Props {
  onResult: (data: { response: RecommendResponse; preferences: PreferenceMap }) => void;
  onHistory: () => void;
}

export default function Home({ onResult, onHistory }: Props) {
  const [selected, setSelected] = useState<PreferenceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string, option: string) => {
    setSelected((prev) => {
      if (prev[key] === option) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: option };
    });
  };

  const hasSelection = Object.keys(selected).length > 0;

  const handleDecide = async () => {
    if (!hasSelection) return;
    setLoading(true);
    setError(null);

    try {
      const response = await recommend({ preferences: selected });
      const imageRes = await generateImage(response.category, response.category);
      response.image_url = imageRes.image_url;
      if (response.image_url) await preloadImage(response.image_url);

      addToHistory({
        preferences: selected,
        category: response.category,
        reason: response.reason,
      });

      onResult({ response, preferences: selected });
    } catch {
      setError('Could not connect. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen home-screen">
      <div className="screen-header">
        <h1 className="home-title">What do you feel like?</h1>
        <button className="history-link" onClick={onHistory}>
          History
        </button>
      </div>

      <p className="home-subtitle">Tap to pick. No typing needed.</p>

      <div className="pref-list">
        {CATEGORIES.map(({ key, label, options }) => (
          <div key={key} className="pref-category">
            <div className="pref-category-label">{label}</div>
            <div className="mood-grid">
              {options.map((option) => (
                <button
                  key={option}
                  className={`mood-chip${selected[key] === option ? ' selected' : ''}`}
                  onClick={() => toggle(key, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="decide-footer">
        <button
          className="decide-btn"
          onClick={handleDecide}
          disabled={!hasSelection || loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Finding your meal…
            </>
          ) : (
            'Decide for me →'
          )}
        </button>
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
