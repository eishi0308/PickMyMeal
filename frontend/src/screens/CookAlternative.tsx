import { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { getCookAlternative } from '../api/foodApi';
import { CookAlternativeResponse } from '../types';

interface Props {
  category: string;
  imageUrl: string | null;
  onOrder: (category: string, imageUrl: string | null) => void;
  onBack: () => void;
  onReset: () => void;
  onLogoClick: () => void;
}

function saveCookedEntry(dish: string, alternative: string, saving: string) {
  const entries = JSON.parse(localStorage.getItem('cookedSavings') || '[]');
  entries.push({ date: new Date().toISOString(), dish, alternative, saving });
  localStorage.setItem('cookedSavings', JSON.stringify(entries));
}

export default function CookAlternative({
  category, imageUrl, onOrder, onBack, onReset, onLogoClick,
}: Props) {
  const [data, setData] = useState<CookAlternativeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [variant, setVariant] = useState<'easier' | 'closer' | undefined>(undefined);
  const [cooked, setCooked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setCooked(false);
    getCookAlternative(category, variant)
      .then((res) => { if (!cancelled) { setData(res); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [category, variant]);

  const handleCooked = () => {
    if (!data) return;
    saveCookedEntry(category, data.alternative_name, data.saving_estimate);
    setCooked(true);
  };

  if (loading) {
    return (
      <div className="screen cook-screen">
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <div className="quick-loading">
          <span className="spinner quick-spinner" />
          <p className="quick-loading-text">Finding a home-cook version…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="screen cook-screen">
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <div className="quick-error">
          <p className="quick-loading-text">Couldn't load the home-cook alternative.</p>
          <button
            className="decide-btn quick-retry-btn"
            onClick={() => { setVariant(undefined); setError(false); setLoading(true); }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen cook-screen">
      <NavBar onLogoClick={onLogoClick} onBack={onBack} />

      {/* Origin label */}
      <p className="cook-origin">You picked</p>
      <p className="cook-origin-dish">{category}</p>

      {/* Alternative card */}
      <div className="primary-card">
        <div className="cook-badge">🏠 Home Cook Alternative</div>
        <h1 className="primary-title">{data.alternative_name}</h1>

        {/* Stats */}
        <div className="cook-stats">
          <span className="cook-stat">⏱ {data.time_minutes} min</span>
          <span className="cook-stat">{data.effort}</span>
          <span className="cook-stat">💰 Save {data.saving_estimate}</span>
        </div>

        {/* Savings breakdown */}
        <div className="cook-savings-card">
          <div className="cook-savings-row">
            <span className="cook-savings-label">Delivery / restaurant</span>
            <span className="cook-savings-value">{data.delivery_estimate}</span>
          </div>
          <div className="cook-savings-row">
            <span className="cook-savings-label">Cook at home</span>
            <span className="cook-savings-value">{data.home_estimate}</span>
          </div>
          <div className="cook-savings-row cook-savings-highlight">
            <span className="cook-savings-label">You could save</span>
            <span className="cook-savings-value">{data.saving_estimate}</span>
          </div>
        </div>

        <p className="primary-reason">{data.explanation}</p>
      </div>

      {/* Ingredients */}
      <div className="cook-section">
        <p className="section-label">Ingredients</p>
        <div className="cook-ingredients">
          {data.ingredients.map((ing, i) => (
            <span key={i} className="cook-ingredient">{ing}</span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="cook-section">
        <p className="section-label">How to make it</p>
        <div className="cook-steps">
          {data.steps.map((step, i) => (
            <div key={i} className="cook-step">
              <span className="cook-step-num">{i + 1}</span>
              <span className="cook-step-text">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="cook-actions">
        {cooked ? (
          <div className="cook-saved-banner">
            Saved! You could pocket {data.saving_estimate} by cooking at home.
          </div>
        ) : (
          <button className="cook-btn" onClick={handleCooked}>
            I'll cook this — save {data.saving_estimate}
          </button>
        )}

        <button className="ubereats-btn" onClick={() => onOrder(category, imageUrl)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 110 16A8 8 0 0112 4zm-1 4v4.586l-2.293-2.293-1.414 1.414L12 16.414l4.707-4.707-1.414-1.414L13 12.586V8h-2z"/>
          </svg>
          Order on Uber Eats anyway
        </button>

        <button
          className="ghost-btn"
          onClick={() => setVariant('easier')}
          disabled={loading}
        >
          Make it even easier
        </button>

        <button
          className="ghost-btn"
          onClick={() => setVariant('closer')}
          disabled={loading}
        >
          Make it closer to {category}
        </button>

        <button className="ghost-btn" onClick={onBack}>
          ← Back to picks
        </button>

        <button className="ghost-btn" onClick={onReset} style={{ color: '#F43F5E', borderColor: '#F43F5E' }}>
          × Start over
        </button>
      </div>
    </div>
  );
}
