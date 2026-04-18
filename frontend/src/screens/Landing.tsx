import { getHistory } from '../api/history';

interface Props {
  onStart: () => void;
  onHistory: () => void;
}

const EMOJIS = ['🍜', '🍕', '🌮', '🍱', '🥗'];

export default function Landing({ onStart, onHistory }: Props) {
  const historyCount = getHistory().length;

  return (
    <div className="landing-screen">
      <div className="landing-emojis">
        {EMOJIS.map((emoji, i) => (
          <span
            key={i}
            className="landing-emoji"
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="landing-content">
        <h1 className="landing-title">DecideMyMeal</h1>
        <p className="landing-tagline">
          Can't decide what to eat?<br />
          Tap a few moods. We'll handle the rest.
        </p>

        <ul className="landing-selling-points">
          <li>No scrolling through endless menus</li>
          <li>No comparing 30 options</li>
          <li>No thinking for 20 minutes</li>
          <li>Just take this — or adjust slightly</li>
        </ul>

        <button className="decide-btn landing-cta" onClick={onStart}>
          Let's go →
        </button>

        {historyCount > 0 && (
          <div className="landing-returning">
            <span>Welcome back — you've tried {historyCount} meal{historyCount !== 1 ? 's' : ''}.</span>
            <button className="history-link" onClick={onHistory}>View history →</button>
          </div>
        )}
      </div>
    </div>
  );
}
