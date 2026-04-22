import NavBar from '../components/NavBar';

interface Props {
  category: string;
  imageUrl: string | null;
  onBack: () => void;
  onReset: () => void;
  onLogoClick: () => void;
}

export default function Order({ category, imageUrl, onBack, onReset, onLogoClick }: Props) {
  const uberUrl = `https://www.ubereats.com/search?q=${encodeURIComponent(category)}`;
  const fallback = `https://loremflickr.com/600/400/food,${encodeURIComponent(category)}`;

  return (
    <div className="screen order-screen">
      <NavBar onLogoClick={onLogoClick} onBack={onBack} />

      {/* Hero image */}
      <div className="order-hero">
        <img
          className="order-hero-img"
          src={imageUrl ?? fallback}
          alt={category}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }}
        />
        <div className="order-hero-overlay" />
        <div className="order-hero-content">
          <span className="order-eyebrow">Great choice</span>
          <h1 className="order-title">{category}</h1>
        </div>
      </div>

      {/* Actions */}
      <div className="order-body">
        <p className="order-subtitle">Ready to order?</p>

        <a
          href={uberUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ubereats-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 110 16A8 8 0 0112 4zm-1 4v4.586l-2.293-2.293-1.414 1.414L12 16.414l4.707-4.707-1.414-1.414L13 12.586V8h-2z"/>
          </svg>
          Order on Uber Eats
        </a>

        <button className="order-back-btn" onClick={onBack}>
          ← Back to picks
        </button>

        <button className="order-reset-btn" onClick={onReset}>
          × Start over
        </button>
      </div>
    </div>
  );
}
