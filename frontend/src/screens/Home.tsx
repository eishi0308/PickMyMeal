import { useState, useEffect } from 'react';
import { recommend } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';
import NavBar from '../components/NavBar';
import QuickMode from './QuickMode';

const ESSENTIALS = [
  { key: 'mood', label: 'Mood?', options: ['Healthy', 'Comfort food', 'Treat yourself', 'Balanced', 'Any'] },
  { key: 'cuisine', label: 'Cuisine', options: ['Japanese', 'Korean', 'Chinese', 'Thai', 'Indian', 'Italian', 'Mexican', 'American', 'Any'] },
  { key: 'meal_type', label: 'Meal type', options: ['Quick bite', 'Full meal', 'Snack', 'Late night', 'Any'] },
  { key: 'protein', label: 'Protein', options: ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Vegan', 'Any'] },
];

const DETAILS = [
  { key: 'temperature', label: 'Hot or cold?', options: ['Hot', 'Cold', 'Either'] },
  { key: 'fullness', label: 'How filling?', options: ['Light', 'Medium', 'Heavy', 'Any'] },
  { key: 'flavor', label: 'Flavor', options: ['Savory', 'Salty', 'Sweet', 'Sour', 'Any'] },
  { key: 'spice_level', label: 'Spice level', options: ['No spice', 'Mild', 'Medium', 'Hot', 'Extra hot', 'Any'] },
  { key: 'base', label: 'Base', options: ['Rice', 'Noodles', 'Bread', 'Salad / Bowl', 'Any'] },
  { key: 'style', label: 'Cooking style', options: ['Fried', 'Soup / Stew', 'Grilled', 'Raw / Fresh', 'Saucy', 'Any'] },
  { key: 'portion', label: 'Portion', options: ['Just me', 'Sharing', 'Any'] },
];

const AVOID = [
  { key: 'avoid_cuisine', label: 'Cuisine to avoid', options: ['Japanese', 'Korean', 'Chinese', 'Thai', 'Indian', 'Italian', 'Mexican', 'American'] },
  { key: 'avoid_ingredient', label: 'Ingredients / types to avoid', options: ['Dairy', 'Gluten', 'Pork', 'Beef', 'Seafood', 'Raw fish', 'Spicy', 'Heavy / oily'] },
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
          <p className="home-subtitle">The more you tell us, the better we'll nail it.</p>

          {/* Essentials */}
          <div className="pref-section-header">The essentials</div>
          <div className="pref-list">
            {ESSENTIALS.map(({ key, label, options }) => (
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

          {/* Details */}
          <div className="pref-section-header">Dial it in further</div>
          <div className="pref-list">
            {DETAILS.map(({ key, label, options }) => (
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

          {/* Avoid */}
          <div className="pref-section-header avoid">Anything you're NOT feeling?</div>
          <p className="pref-section-sub">Sometimes it's easier to say what you don't want.</p>
          <div className="pref-list">
            {AVOID.map(({ key, label, options }) => {
              const selected_values = selected[key] ? selected[key].split(',') : [];
              return (
                <div key={key} className="pref-category">
                  <div className="pref-category-label">{label}</div>
                  <div className="mood-grid">
                    {options.map((option) => (
                      <button
                        key={option}
                        className={`mood-chip avoid-chip${selected_values.includes(option) ? ' avoid-selected' : ''}`}
                        onClick={() => onToggle(key, option)}
                      >
                        {selected_values.includes(option) ? `✕ ${option}` : option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
