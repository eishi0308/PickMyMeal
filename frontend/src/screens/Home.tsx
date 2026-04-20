import { useState, useEffect } from 'react';
import { recommend, generateImage } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';
import NavBar from '../components/NavBar';
import QuickMode from './QuickMode';

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
  selected: PreferenceMap;
  initialMode?: 'quick' | 'fine';
  lastResultNames?: string[];
  onToggle: (key: string, option: string) => void;
  onResult: (data: { response: RecommendResponse; backups: RecommendResponse[]; preferences: PreferenceMap }) => void;
  onBackToResult?: () => void;
  onHistory: () => void;
  onLogoClick: () => void;
}

export default function Home({ selected, initialMode = 'quick', lastResultNames = [], onToggle, onResult, onBackToResult, onHistory, onLogoClick }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'fine'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const hasSelection = Object.keys(selected).length > 0;

  const handleDecideWithPrefs = async (prefs: PreferenceMap) => {
    setLoading(true);
    setError(null);
    try {
      const best = await recommend({ preferences: prefs });
      const backup1 = await recommend({ preferences: prefs, exclude: [best.category] });
      const backup2 = await recommend({ preferences: prefs, exclude: [best.category, backup1.category] });
      addToHistory({ preferences: prefs, category: best.category, reason: best.reason });
      // Navigate immediately — images load progressively inside Result
      onResult({ response: best, backups: [backup1, backup2], preferences: prefs });
    } catch {
      setError('Could not connect. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDecide = async () => {
    if (!hasSelection) return;
    handleDecideWithPrefs(selected);
  };

  return (
    <div className="screen home-screen">
      <NavBar onLogoClick={onLogoClick} onHistory={onHistory} />

      {lastResultNames.length > 0 && onBackToResult && (
        <button className="last-result-banner" onClick={onBackToResult}>
          <div className="last-result-top">
            <span className="last-result-label">Last result</span>
            <span className="last-result-arrow">View →</span>
          </div>
          <div className="last-result-chips">
            {lastResultNames.map((name, i) => (
              <span key={i} className={`last-result-chip${i === 0 ? ' best' : ''}`}>
                {i === 0 ? '⭐ ' : ''}{name}
              </span>
            ))}
          </div>
        </button>
      )}

      <div className="mode-toggle">
        <button
          className={`mode-btn${mode === 'quick' ? ' active' : ''}`}
          onClick={() => { setMode('quick'); setError(null); }}
        >
          ⚡ Quick
        </button>
        <button
          className={`mode-btn${mode === 'fine' ? ' active' : ''}`}
          onClick={() => { setMode('fine'); setError(null); }}
        >
          🎛 Fine Tune
        </button>
      </div>

      {mode === 'quick' ? (
        loading ? (
          <div className="quick-loading">
            <span className="spinner quick-spinner" />
            <p className="quick-loading-text">Finding your meal…</p>
          </div>
        ) : error ? (
          <div className="quick-error">
            <p className="error-msg">{error}</p>
            <button className="ghost-btn quick-retry-btn" onClick={() => setError(null)}>
              Try again
            </button>
          </div>
        ) : (
          <QuickMode onSubmit={handleDecideWithPrefs} />
        )
      ) : (
        <>
          <h1 className="home-title">What do you feel like?</h1>
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
                      onClick={() => onToggle(key, option)}
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
        </>
      )}
    </div>
  );
}
