interface Props {
  onLogoClick: () => void;
  onHistory?: () => void;
  onBack?: () => void;
}

export default function NavBar({ onLogoClick, onHistory, onBack }: Props) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        {onBack && (
          <button className="back-btn" onClick={onBack}>← Back</button>
        )}
      </div>
      <button className="navbar-logo" onClick={onLogoClick}>DecideMyMeal</button>
      <div className="navbar-right">
        {onHistory && (
          <button className="history-link" onClick={onHistory}>History</button>
        )}
      </div>
    </nav>
  );
}
