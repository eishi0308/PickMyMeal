interface Props {
  category: string;
  onBack: () => void;
  onReset: () => void;
}

export default function Order({ category, onBack, onReset }: Props) {
  const uberUrl = `https://www.ubereats.com/search?q=${encodeURIComponent(category)}`;

  return (
    <div className="screen order-screen">
      <div className="order-body">
        <p className="order-eyebrow">You picked</p>
        <h1 className="order-title">{category}</h1>
        <p className="order-subtitle">Ready to order?</p>

        <a
          href={uberUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ubereats-btn order-uber-btn"
        >
          Order on Uber Eats →
        </a>

        <button className="order-back-btn" onClick={onBack}>
          Not now, go back
        </button>

        <button className="order-reset-btn" onClick={onReset}>
          Start over
        </button>
      </div>
    </div>
  );
}
