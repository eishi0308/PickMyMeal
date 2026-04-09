import { useState } from 'react';
import { recommend, generateImage } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';
import NavBar from '../components/NavBar';

interface ResultData {
  response: RecommendResponse;
  backups: RecommendResponse[];
  preferences: PreferenceMap;
}

interface Props {
  best: RecommendResponse;
  backups: RecommendResponse[];
  preferences: PreferenceMap;
  excludes: string[];
  onResult: (data: ResultData) => void;
  onBack: () => void;
  onReset: () => void;
  onHistory: () => void;
  onLogoClick: () => void;
}

export default function Result({ best, backups, preferences, excludes, onResult, onBack, onReset, onHistory, onLogoClick }: Props) {
  const [loading, setLoading] = useState(false);
  const fallbackUrl = `https://loremflickr.com/600/400/food,${encodeURIComponent(best.category)}`;

  const handleTryAgain = async () => {
    setLoading(true);
    try {
      const r1 = await recommend({ preferences, exclude: excludes });
      const r2 = await recommend({ preferences, exclude: [...excludes, r1.category] });
      const r3 = await recommend({ preferences, exclude: [...excludes, r1.category, r2.category] });
      const [img0, img1, img2] = await Promise.all([
        generateImage(r1.category, r1.category),
        generateImage(r2.category, r2.category),
        generateImage(r3.category, r3.category),
      ]);
      r1.image_url = img0.image_url;
      r2.image_url = img1.image_url;
      r3.image_url = img2.image_url;
      addToHistory({ preferences, category: r1.category, reason: r1.reason });
      onResult({ response: r1, backups: [r2, r3], preferences });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen result-screen">
      <NavBar onLogoClick={onLogoClick} onBack={onBack} onHistory={onHistory} />

      {/* Best Pick */}
      <div className="best-card">
        <div className="best-badge">⭐ Best Pick</div>
        <div className="best-category">{best.category}</div>
        <div className="best-image-wrap">
          <img
            className="best-image"
            src={best.image_url ?? fallbackUrl}
            alt={best.category}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackUrl; }}
          />
        </div>
        <p className="best-reason">{best.reason}</p>
        <a
          href={`https://www.ubereats.com/search?q=${encodeURIComponent(best.category)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ubereats-btn"
        >
          Order on Uber Eats →
        </a>
      </div>

      {/* Backups */}
      {backups.length > 0 && (
        <div className="backups-section">
          <div className="backups-label">Also consider</div>
          <div className="backups-list">
            {backups.map((item, i) => {
              const fb = `https://loremflickr.com/600/400/food,${encodeURIComponent(item.category)}`;
              return (
                <div key={i} className="backup-card">
                  <img
                    className="backup-image"
                    src={item.image_url ?? fb}
                    alt={item.category}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = fb; }}
                  />
                  <div className="backup-body">
                    <div className="backup-number">{i + 1}</div>
                    <div className="backup-category">{item.category}</div>
                    <p className="backup-reason">{item.reason}</p>
                    <a
                      href={`https://www.ubereats.com/search?q=${encodeURIComponent(item.category)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="backup-uber"
                    >
                      Order on Uber Eats →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="result-actions">
        <button className="decide-btn" onClick={handleTryAgain} disabled={loading}>
          {loading ? <><span className="spinner" /> Finding new picks…</> : 'Try different picks →'}
        </button>
        <button className="ghost-btn" onClick={onReset}>Start over</button>
      </div>
    </div>
  );
}
