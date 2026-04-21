import { useState } from 'react';
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
    key: 'flavor',
    question: 'Salty or sweet?',
    options: [
      { value: 'Salty', emoji: '🧂', label: 'Salty' },
      { value: 'Sweet', emoji: '🍯', label: 'Sweet' },
    ],
  },
];

interface Props {
  onSubmit: (preferences: PreferenceMap) => void;
}

export default function QuickMode({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PreferenceMap>({});

  const currentStep = STEPS[step];
  const hasAnsweredCurrent = !!answers[currentStep.key];
  const canGoBack = step > 0;
  const canGoForward = step < STEPS.length - 1 && hasAnsweredCurrent;

  const handleChoice = (value: string) => {
    const newAnswers = { ...answers, [STEPS[step].key]: value };
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onSubmit(newAnswers);
    }
  };

  const goBack = () => { if (canGoBack) setStep(step - 1); };
  const goForward = () => { if (canGoForward) setStep(step + 1); };

  return (
    <div className="quick-mode">
      <div className="quick-progress">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`quick-dot${i < step ? ' done' : i === step ? ' active' : ''}`}
          />
        ))}
      </div>

      <div className="quick-step" key={step}>
        <p className="quick-step-label">{step + 1} of {STEPS.length}</p>
        <h2 className="quick-question">{currentStep.question}</h2>
        <div className="quick-options">
          {currentStep.options.map(({ value, emoji, label }) => (
            <button
              key={value}
              className={`quick-card${answers[currentStep.key] === value ? ' selected' : ''}`}
              onClick={() => handleChoice(value)}
            >
              <span className="quick-card-emoji">{emoji}</span>
              <span className="quick-card-label">{label}</span>
            </button>
          ))}
        </div>

        <div className="quick-nav">
          <button
            className="quick-nav-btn"
            onClick={goBack}
            disabled={!canGoBack}
            aria-label="Previous"
          >
            ←
          </button>
          <button
            className="quick-nav-btn"
            onClick={goForward}
            disabled={!canGoForward}
            aria-label="Next"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
