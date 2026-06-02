import { useState } from 'react';
import NavBar from '../components/NavBar';
import { CookExactResponse } from '../types';

interface Props {
  category: string;
  imageUrl: string | null;
  data: CookExactResponse | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSwitchToEasy: () => void;
  onOrder: (category: string, imageUrl: string | null) => void;
  onBack: () => void;
  onLogoClick: () => void;
}

export default function CookExact({
  category, imageUrl, data, loading, error,
  onRetry, onSwitchToEasy, onOrder, onBack, onLogoClick,
}: Props) {
  const [cookMode, setCookMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  if (loading) {
    return (
      <div className="screen cook-screen">
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <div className="quick-loading">
          <span className="spinner quick-spinner" />
          <p className="quick-loading-text">Building the real recipe…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="screen cook-screen">
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <div className="quick-error">
          <p className="quick-loading-text">Couldn't load the recipe.</p>
          <button className="decide-btn quick-retry-btn" onClick={onRetry}>Try again</button>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / data.steps.length) * 100;

  const handleNextStep = () => {
    if (currentStep < data.steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setCookMode(false);
      setDone(true);
    }
  };

  return (
    <div className="screen cook-screen">
      <NavBar onLogoClick={onLogoClick} onBack={onBack} />

      {/* Header flow */}
      <div className="cook-flow">
        <span className="cook-flow-original">{category}</span>
        <span className="cook-flow-arrow">→</span>
        <span className="cook-flow-label cook-exact-label"><span className="cook-flow-emoji">👨‍🍳</span> Real recipe</span>
      </div>

      {/* Primary card */}
      <div className="primary-card">
        <h1 className="primary-title">{data.dish_name}</h1>

        {imageUrl && (
          <div className="primary-image-wrap">
            <img className="primary-image image-fade-in" src={imageUrl} alt={data.dish_name} />
          </div>
        )}

        <div className="cook-stats">
          <span className="cook-stat">⏱ {data.time_minutes} min</span>
          <span className="cook-stat">{data.effort}</span>
          <span className="cook-stat">Serves {data.serves}</span>
          {data.saving_estimate && <span className="cook-stat">💰 Save {data.saving_estimate}</span>}
        </div>

        {data.delivery_estimate && (
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
        )}

        {data.tip && (
          <div className="cook-exact-tip">
            <span className="cook-exact-tip-icon">💡</span>
            <span>{data.tip}</span>
          </div>
        )}
      </div>

      {/* Cook mode (step-by-step) OR ingredients + steps */}
      {cookMode ? (
        <div className="cook-mode">
          <div className="cook-mode-header">
            <span className="cook-mode-label">Step {currentStep + 1} of {data.steps.length}</span>
            <button className="cook-mode-exit" onClick={() => setCookMode(false)}>Exit cook mode</button>
          </div>
          <div className="qm-progress-track">
            <div className="qm-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="cook-mode-text">{data.steps[currentStep]}</p>
          <button className="cook-btn" onClick={handleNextStep}>
            {currentStep < data.steps.length - 1 ? 'Next step →' : 'Done! 🎉'}
          </button>
        </div>
      ) : (
        <>
          <div className="cook-section">
            <p className="section-label">Ingredients</p>
            <div className="cook-ingredients">
              {data.ingredients.map((ing, i) => (
                <span key={i} className="cook-ingredient">{ing}</span>
              ))}
            </div>
          </div>

          <div className="cook-section">
            <p className="section-label">How to make it</p>
            <div className="cook-steps">
              {data.steps.map((step, i) => (
                <div key={i} className="cook-step">
                  <span className="cook-step-num">{i + 1}</span>
                  <span className="cook-step-text">{step.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="cook-actions">
        {done ? (
          <div className="cook-saved-banner">
            You made the real {category}! 🎉
          </div>
        ) : !cookMode ? (
          <button className="cook-btn" onClick={() => { setCookMode(true); setCurrentStep(0); }}>
            Start cooking — step by step
          </button>
        ) : null}

        <button className="ubereats-btn" onClick={() => onOrder(category, imageUrl)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 110 16A8 8 0 0112 4zm-1 4v4.586l-2.293-2.293-1.414 1.414L12 16.414l4.707-4.707-1.414-1.414L13 12.586V8h-2z" />
          </svg>
          Order on Uber Eats instead
        </button>

        {/* Escape hatch */}
        <div className="cook-exact-escape">
          <p className="cook-exact-escape-text">Looks too complex?</p>
          <button className="variant-btn cook-exact-escape-btn" onClick={onSwitchToEasy}>
            Show me the easy home version →
          </button>
        </div>

        <button className="back-link-btn" onClick={onBack}>← Back to picks</button>
      </div>
    </div>
  );
}
