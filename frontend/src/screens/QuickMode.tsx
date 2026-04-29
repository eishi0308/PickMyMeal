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
  const submitting = useRef(false);

  const currentStep = STEPS[step];
  const progressPct = ((step + 1) / STEPS.length) * 100;
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
      submitting.current = true;
      onSubmit(newAnswers);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setSlideDir('back');
      setStep(s => s - 1);
    }
  };

  return (
    <div className="quick-mode">
      {/* Progress bar */}
      <div className="qm-progress-track">
        <div className="qm-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Previous answer chips */}
      {prevAnswers.length > 0 && (
        <div className="qm-prev-answers">
          {prevAnswers.map((a, i) => (
            <span key={i} className="qm-prev-chip">{a.emoji} {a.label}</span>
          ))}
        </div>
      )}

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
