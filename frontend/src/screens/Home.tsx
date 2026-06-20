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
  const [fineStep, setFineStep] = useState(0);
  const [slideDir, setSlideDir] = useState<'fwd' | 'back'>('fwd');

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === 'fine') setFineStep(0);
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

  const goToStep = (next: number, dir: 'fwd' | 'back') => {
    setSlideDir(dir);
    setFineStep(next);
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
          onClick={() => { setMode('fine'); setFineStep(0); setSlideDir('fwd'); setError(null); }}
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
      ) : loading ? (
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
        <div className="fine-tune">
          {/* Progress bar */}
          <div className="fine-progress-track">
            <div className="fine-progress-fill" style={{ width: `${((fineStep + 1) / 3) * 100}%` }} />
          </div>

          {/* Step header */}
          <div className="fine-step-label">Step {fineStep + 1} of 3</div>
          <h2 className="fine-step-title">
            {['The essentials', 'Dial it in', 'Anything off limits?'][fineStep]}
          </h2>
          <p className="fine-step-sub">
            {[
              "What are you in the mood for today?",
              "Optional — skip anything you're flexible on.",
              "Select what to avoid. Pick as many as you like.",
            ][fineStep]}
          </p>

          {/* Categories — keyed so React remounts on step change, triggering animation */}
          <div key={fineStep} className={`fine-step-body fine-step-body--${slideDir}`}>
            {(fineStep === 0 ? ESSENTIALS : fineStep === 1 ? DETAILS : AVOID).map(({ key, label, options }) => {
              const isAvoid = fineStep === 2;
              const avoidVals = isAvoid && selected[key] ? selected[key].split(',') : [];
              return (
                <div key={key} className="pref-category">
                  <div className="pref-category-label">{label}</div>
                  <div className="mood-grid">
                    {options.map((option) => {
                      const isOn = isAvoid ? avoidVals.includes(option) : selected[key] === option;
                      return (
                        <button
                          key={option}
                          className={`mood-chip${isAvoid ? ' avoid-chip' : ''}${isOn ? (isAvoid ? ' avoid-selected' : ' selected') : ''}`}
                          onClick={() => onToggle(key, option)}
                        >
                          {isAvoid && isOn ? `✕ ${option}` : option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Escape hatch: decide from step 2 without going to avoid */}
          {fineStep === 1 && hasSelection && (
            <button className="fine-skip-link" onClick={handleDecide}>
              Decide now, skip avoids →
            </button>
          )}

          {/* Step footer */}
          <div className="fine-step-footer">
            <div className="fine-footer-left">
              {fineStep > 0 && (
                <button className="fine-back-btn" onClick={() => goToStep(fineStep - 1, 'back')}>
                  ← Back
                </button>
              )}
            </div>
            <div className="fine-footer-right">
              {fineStep < 2 ? (
                <button className="fine-next-btn" onClick={() => goToStep(fineStep + 1, 'fwd')}>
                  Continue →
                </button>
              ) : (
                <button
                  className="fine-decide-btn"
                  onClick={handleDecide}
                  disabled={!hasSelection}
                >
                  Decide for me →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
