import { useState, useEffect, useRef } from 'react';
import NavBar from '../components/NavBar';
import { getCookAlternative, generateImage } from '../api/foodApi';
import { CookAlternativeResponse } from '../types';

interface Props {
  category: string;
  imageUrl: string | null;
  prefetchedData: CookAlternativeResponse | null;
  prefetchLoading: boolean;
  prefetchedAltImage: string | null;
  onOrder: (category: string, imageUrl: string | null) => void;
  onBack: () => void;
  onReset: () => void;
  onLogoClick: () => void;
}

interface SavingsEntry {
  date: string;
  dish: string;
  alternative: string;
  saving: string;
  amount: number;
}

function parseSavingMidpoint(saving: string): number {
  const match = saving.replace('~', '').match(/\$(\d+)[–\-](\d+)/);
  if (!match) return 0;
  return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
}

function loadSavings(): { count: number; total: number } {
  const entries: SavingsEntry[] = JSON.parse(localStorage.getItem('cookedSavings') || '[]');
  const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  return { count: entries.length, total };
}

function saveCookedEntry(dish: string, alternative: string, saving: string) {
  const entries: SavingsEntry[] = JSON.parse(localStorage.getItem('cookedSavings') || '[]');
  entries.push({ date: new Date().toISOString(), dish, alternative, saving, amount: parseSavingMidpoint(saving) });
  localStorage.setItem('cookedSavings', JSON.stringify(entries));
}

export default function CookAlternative({
  category, imageUrl, prefetchedData, prefetchLoading, prefetchedAltImage,
  onOrder, onBack, onReset, onLogoClick,
}: Props) {
  // Variant state — when set, fetches internally
  const [variant, setVariant] = useState<'easier' | 'closer' | undefined>(undefined);
  const [variantData, setVariantData] = useState<CookAlternativeResponse | null>(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantError, setVariantError] = useState(false);

  // Self-fetch fallback if prefetch failed
  const [selfData, setSelfData] = useState<CookAlternativeResponse | null>(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState(false);
  const didSelfFetch = useRef(false);

  // Image for the alternative dish
  const [altImage, setAltImage] = useState<string | null>(null);

  // Cook mode (step-by-step)
  const [cooked, setCooked] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Savings counter
  const [savings, setSavings] = useState(() => loadSavings());

  // Self-fetch: fires only if prefetch failed (both loading=false AND data=null)
  useEffect(() => {
    if (variant !== undefined || prefetchedData || prefetchLoading || didSelfFetch.current) return;
    didSelfFetch.current = true;
    setSelfLoading(true);
    setSelfError(false);
    getCookAlternative(category)
      .then(res => { setSelfData(res); setSelfLoading(false); })
      .catch(() => { setSelfError(true); setSelfLoading(false); });
  }, [variant, prefetchedData, prefetchLoading, category]);

  // Variant fetch
  useEffect(() => {
    if (variant === undefined) return;
    let cancelled = false;
    setVariantLoading(true);
    setVariantError(false);
    setVariantData(null);
    setCooked(false);
    setCookMode(false);
    getCookAlternative(category, variant)
      .then(res => { if (!cancelled) { setVariantData(res); setVariantLoading(false); } })
      .catch(() => { if (!cancelled) { setVariantError(true); setVariantLoading(false); } });
    return () => { cancelled = true; };
  }, [variant, category]);

  // Derived: which data/loading/error to use
  const activeData = variantData ?? prefetchedData ?? selfData;
  const loading = variant !== undefined ? variantLoading : (prefetchLoading || selfLoading);
  const error = variant !== undefined ? variantError : selfError;

  // Fetch image whenever activeData changes — use prefetched image if available and no variant active
  useEffect(() => {
    if (!activeData) return;
    if (prefetchedAltImage && variant === undefined) {
      setAltImage(prefetchedAltImage);
      return;
    }
    setAltImage(null);
    generateImage(activeData.alternative_name, activeData.alternative_name)
      .then(img => setAltImage(img.image_url));
  }, [activeData?.alternative_name, variant]);

  const handleCooked = () => {
    if (!activeData) return;
    saveCookedEntry(category, activeData.alternative_name, activeData.saving_estimate);
    setSavings(loadSavings());
    setCooked(true);
    setCookMode(true);
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    if (!activeData) return;
    if (currentStep < activeData.steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setCookMode(false);
    }
  };

  const handleRetry = () => {
    didSelfFetch.current = false;
    setSelfData(null);
    setSelfError(false);
    setSelfLoading(true);
    getCookAlternative(category)
      .then(res => { setSelfData(res); setSelfLoading(false); })
      .catch(() => { setSelfError(true); setSelfLoading(false); });
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

  if (error || !activeData) {
    return (
      <div className="screen cook-screen">
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <div className="quick-error">
          <p className="quick-loading-text">Couldn't load the home-cook alternative.</p>
          <button className="decide-btn quick-retry-btn" onClick={handleRetry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / activeData.steps.length) * 100;

  return (
    <div className="screen cook-screen">
      <NavBar onLogoClick={onLogoClick} onBack={onBack} />

      {/* Lifetime savings counter */}
      {savings.count > 0 && (
        <div className="cook-savings-counter">
          🏠 {savings.count} home cook{savings.count > 1 ? 's' : ''} · ~${savings.total} saved so far
        </div>
      )}

      {/* Origin → transformation flow */}
      <div className="cook-flow">
        <span className="cook-flow-original">{category}</span>
        <span className="cook-flow-arrow">→</span>
        <span className="cook-flow-label"><span className="cook-flow-emoji">⚡</span> Easy version</span>
      </div>

      {/* Alternative card */}
      <div className="primary-card">
        <h1 className="primary-title">{activeData.alternative_name}</h1>

        {/* Why it's different — shown immediately so users understand before anything else */}
        <p className="cook-why-different">{activeData.explanation}</p>

        {/* Dish image */}
        <div className="primary-image-wrap">
          {altImage
            ? <img className="primary-image image-fade-in" src={altImage} alt={activeData.alternative_name} />
            : <div className="image-shimmer" />
          }
        </div>

        {/* Stats chips */}
        <div className="cook-stats">
          <span className="cook-stat">⏱ {activeData.time_minutes} min</span>
          <span className="cook-stat">{activeData.effort}</span>
          <span className="cook-stat">💰 Save {activeData.saving_estimate}</span>
        </div>

        {/* Savings breakdown */}
        <div className="cook-savings-card">
          <div className="cook-savings-row">
            <span className="cook-savings-label">Delivery / restaurant</span>
            <span className="cook-savings-value">{activeData.delivery_estimate}</span>
          </div>
          <div className="cook-savings-row">
            <span className="cook-savings-label">Cook at home</span>
            <span className="cook-savings-value">{activeData.home_estimate}</span>
          </div>
          <div className="cook-savings-row cook-savings-highlight">
            <span className="cook-savings-label">You could save</span>
            <span className="cook-savings-value">{activeData.saving_estimate}</span>
          </div>
        </div>
      </div>

      {/* Cook mode (step-by-step) OR ingredients + steps list */}
      {cookMode ? (
        <div className="cook-mode">
          <div className="cook-mode-header">
            <span className="cook-mode-label">Step {currentStep + 1} of {activeData.steps.length}</span>
            <button className="cook-mode-exit" onClick={() => setCookMode(false)}>Exit cook mode</button>
          </div>
          <div className="qm-progress-track">
            <div className="qm-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="cook-mode-text">{activeData.steps[currentStep]}</p>
          <button
            className="cook-btn"
            onClick={handleNextStep}
          >
            {currentStep < activeData.steps.length - 1 ? `Next step →` : `Done! 🎉`}
          </button>
        </div>
      ) : (
        <>
          <div className="cook-section">
            <p className="section-label">Ingredients</p>
            <div className="cook-ingredients">
              {activeData.ingredients.map((ing, i) => (
                <span key={i} className="cook-ingredient">{ing}</span>
              ))}
            </div>
          </div>

          <div className="cook-section">
            <p className="section-label">How to make it</p>
            <div className="cook-steps">
              {activeData.steps.map((step, i) => (
                <div key={i} className="cook-step">
                  <span className="cook-step-num">{i + 1}</span>
                  <span className="cook-step-text">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="cook-actions">
        {cooked && !cookMode ? (
          <div className="cook-saved-banner">
            Cooked at home! You saved ~{activeData.saving_estimate} 🎉
          </div>
        ) : !cooked ? (
          <button className="cook-btn" onClick={handleCooked}>
            I'll cook this — save {activeData.saving_estimate}
          </button>
        ) : null}

        <button className="ubereats-btn" onClick={() => onOrder(category, imageUrl)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 110 16A8 8 0 0112 4zm-1 4v4.586l-2.293-2.293-1.414 1.414L12 16.414l4.707-4.707-1.414-1.414L13 12.586V8h-2z"/>
          </svg>
          Order on Uber Eats anyway
        </button>

        <button className="variant-btn" onClick={() => { setVariant('easier'); setCooked(false); setCookMode(false); }}>
          Make it even easier
        </button>
        <button className="variant-btn" onClick={() => { setVariant('closer'); setCooked(false); setCookMode(false); }}>
          Make it closer to {category}
        </button>
        <button className="back-link-btn" onClick={onBack}>← Back to picks</button>
        <button className="ghost-btn" onClick={onReset} style={{ color: '#F43F5E', borderColor: '#F43F5E' }}>
          × Start over
        </button>
      </div>
    </div>
  );
}
