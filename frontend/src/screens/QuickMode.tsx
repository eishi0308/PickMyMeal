import { useState, useRef } from 'react';
import { PreferenceMap } from '../types';

const STEPS = [
  {
    key: 'temperature',
    question: 'Hot or cold?',
    options: [
      { value: 'Hot', emoji: '🔥', label: 'Hot' },
      { value: 'Cold', emoji: '🧊', label: 'Cold' },
    ],
  },
  {
    key: 'fullness',
    question: 'Light or heavy?',
    options: [
      { value: 'Light', emoji: '🥗', label: 'Light' },
      { value: 'Heavy', emoji: '🍖', label: 'Heavy' },
    ],
  },
  {
    key: 'mood',
    question: "What's the vibe?",
    options: [
      { value: 'Comfort food', emoji: '🍲', label: 'Comfort food' },
      { value: 'Healthy', emoji: '🥗', label: 'Healthy' },
      { value: 'Treat yourself', emoji: '🍰', label: 'Treat yourself' },
    ],
  },
];

interface Props {
  onSubmit: (preferences: PreferenceMap) => void;
}

export default function QuickMode({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PreferenceMap>({});
  const [slideDir, setSlideDir] = useState<'fwd' | 'back'>('fwd');
  const [showConfirm, setShowConfirm] = useState(false);
  const submitting = useRef(false);

  const currentStep = STEPS[step];
  const progressPct = showConfirm ? 100 : ((step + 1) / STEPS.length) * 100;
  const prevAnswers = STEPS.slice(0, step).filter(s => answers[s.key]).map(s => {
    const opt = s.options.find(o => o.value === answers[s.key]);
    return opt ? { emoji: opt.emoji, label: opt.label } : null;
  }).filter(Boolean) as { emoji: string; label: string }[];

  const handleChoice = (value: string) => {
    if (submitting.current) return;
    const newAnswers = { ...answers, [STEPS[step].key]: value };
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      setSlideDir('fwd');
      setStep(s => s + 1);
    } else {
      setSlideDir('fwd');
      setShowConfirm(true);
    }
  };

  const goBack = () => {
    if (showConfirm) {
      setSlideDir('back');
      setShowConfirm(false);
    } else if (step > 0) {
      setSlideDir('back');
      setStep(s => s - 1);
    }
  };

  const handleConfirm = () => {
    if (submitting.current) return;
    submitting.current = true;
    onSubmit(answers);
  };

  if (showConfirm) {
    return (
      <div className="quick-mode">
        <div className="qm-progress-track">
          <div className="qm-progress-fill" style={{ width: '100%' }} />
        </div>

        <div key="confirm" className="qm-step qm-step--fwd">
          <h2 className="quick-question">Does this look right?</h2>
          <div className="qm-confirm-list">
            {STEPS.map(s => {
              const opt = s.options.find(o => o.value === answers[s.key]);
              if (!opt) return null;
              return (
                <div key={s.key} className="qm-confirm-row">
                  <span className="qm-confirm-emoji">{opt.emoji}</span>
                  <div className="qm-confirm-text">
                    <span className="qm-confirm-q">{s.question}</span>
                    <span className="qm-confirm-a">{opt.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="qm-confirm-btn" onClick={handleConfirm}>
            Find my meal →
          </button>
        </div>

        <div className="qm-footer">
          <button className="qm-back-btn" onClick={goBack}>← Change something</button>
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className="quick-mode">
      {/* Progress bar */}
      <div className="qm-progress-track">
        <div className="qm-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Previous answer chips — always rendered to keep vertical axis consistent */}
      <div className="qm-prev-answers">
        {prevAnswers.map((a, i) => (
          <span key={i} className="qm-prev-chip">{a.emoji} {a.label}</span>
        ))}
      </div>

      {/* Animated step content */}
      <div key={`${step}-${slideDir}`} className={`qm-step qm-step--${slideDir}`}>
        <h2 className="quick-question">{currentStep.question}</h2>
        <div className="qm-options">
          {currentStep.options.map(({ value, emoji, label }) => {
            const isSelected = answers[currentStep.key] === value;
            return (
              <button
                key={value}
                className={`qm-card${isSelected ? ' selected' : ''}`}
                onClick={() => handleChoice(value)}
              >
                <span className="qm-card-emoji">{emoji}</span>
                <span className="qm-card-label">{label}</span>
                <span className="qm-card-arrow">{isSelected ? '✓' : '→'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Back button */}
      <div className="qm-footer">
        {step > 0 ? (
          <button className="qm-back-btn" onClick={goBack}>← Back</button>
        ) : (
          <span />
        )}
        <span className="qm-step-counter">{step + 1} / {STEPS.length}</span>
      </div>
    </div>
  );
}
