import NavBar from '../components/NavBar';
import { CookAlternativeResponse } from '../types';

interface Props {
  category: string;
  imageUrl: string | null;
  easyData: CookAlternativeResponse | null;
  easyLoading: boolean;
  onChooseEasy: () => void;
  onChooseExact: () => void;
  onBack: () => void;
  onLogoClick: () => void;
}

export default function CookGateway({
  category, imageUrl, easyData, easyLoading,
  onChooseEasy, onChooseExact, onBack, onLogoClick,
}: Props) {
  const easySubtitle = easyLoading
    ? 'Quick & simple, any kitchen'
    : easyData
      ? `~${easyData.time_minutes} min · ${easyData.effort} · Save ${easyData.saving_estimate}`
      : 'Quick & simple, any kitchen';

  return (
    <div className="screen cook-gateway-screen">
      <NavBar onLogoClick={onLogoClick} onBack={onBack} />

      <div className="cook-gateway-header">
        {imageUrl && (
          <img
            className="cook-gateway-img"
            src={imageUrl}
            alt={category}
          />
        )}
        <h1 className="cook-gateway-title">
          How do you want to<br />cook <em>{category}</em>?
        </h1>
        <p className="cook-gateway-sub">Pick your approach — you can always switch.</p>
      </div>

      <div className="cook-gateway-cards">
        {/* Card A — Exact real recipe */}
        <button className="cook-gateway-card cook-gateway-card--real" onClick={onChooseExact}>
          <div className="cook-gateway-card-top">
            <span className="cook-gateway-card-icon">👨‍🍳</span>
            <div className="cook-gateway-card-badge cook-gateway-card-badge--real">Authentic</div>
          </div>
          <p className="cook-gateway-card-title">Make the real thing</p>
          <p className="cook-gateway-card-desc">Full recipe — real ingredients, proper technique</p>
          <div className="cook-gateway-card-cta">
            Get the recipe <span>→</span>
          </div>
        </button>

        {/* Card B — Easy adapted version */}
        <button className="cook-gateway-card cook-gateway-card--easy" onClick={onChooseEasy}>
          <div className="cook-gateway-card-top">
            <span className="cook-gateway-card-icon">⚡</span>
            <div className="cook-gateway-card-badge cook-gateway-card-badge--easy">Quick</div>
          </div>
          <p className="cook-gateway-card-title">Easy home version</p>
          <p className="cook-gateway-card-desc">{easySubtitle}</p>
          <div className="cook-gateway-card-cta">
            {easyLoading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Loading…</>
              : <>Show easy version <span>→</span></>
            }
          </div>
        </button>
      </div>
    </div>
  );
}
