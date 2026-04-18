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
  onOrder: (category: string) => void;
}

export default function Result({
  best, backups, preferences, excludes,
  onResult, onBack, onReset, onHistory, onLogoClick, onOrder,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [expandedBackup, setExpandedBackup] = useState<number | null>(null);
  const fallbackUrl = `https://loremflickr.com/600/400/food,${encodeURIComponent(best.category)}`;

  const handleTryAgain = async () => {
    setLoading(true);
    setExpandedBackup(null);
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

      {/* Primary card */}
      <div className="primary-card">
        <div className="primary-badge">⭐ Best Pick</div>
        <h1 className="primary-title">{best.category}</h1>
        <div className="primary-image-wrap">
          <img
            className="primary-image"
            src={best.image_url ?? fallbackUrl}
            alt={best.category}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackUrl; }}
          />
        </div>
        <p className="primary-reason">{best.reason}</p>
      </div>

      {/* Action layer */}
      <div className="action-layer">
        <button className="take-btn" onClick={() => onOrder(best.category)}>
          ✅ Take this
        </button>
        <button className="tune-btn" disabled>
          🔁 Tune it
        </button>
      </div>

      {/* Backups — compact list */}
      <div className="backups-compact">
        <p className="backups-compact-label">Or try:</p>
        {backups.map((item, i) => {
          const isExpanded = expandedBackup === i;
          const fb = `https://loremflickr.com/600/400/food,${encodeURIComponent(item.category)}`;

          return (
            <div key={i}>
              {isExpanded ? (
                <div className="primary-card backup-expanded-card">
                  <div className="primary-badge">#{i + 2} Pick</div>
                  <h2 className="primary-title">{item.category}</h2>
                  <div className="primary-image-wrap">
                    <img
                      className="primary-image"
                      src={item.image_url ?? fb}
                      alt={item.category}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = fb; }}
                    />
                  </div>
                  <p className="primary-reason">{item.reason}</p>
                  <div className="action-layer">
                    <button className="take-btn" onClick={() => onOrder(item.category)}>
                      ✅ Take this
                    </button>
                    <button className="tune-btn" disabled>
                      🔁 Tune it
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="backup-row"
                  onClick={() => setExpandedBackup(i)}
                >
                  <span className="backup-row-bullet">•</span>
                  <span className="backup-row-name">{item.category}</span>
                  <span className="backup-row-reason">{item.reason}</span>
                  <span className="backup-row-arrow">›</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="result-actions">
        <button className="decide-btn" onClick={handleTryAgain} disabled={loading}>
          {loading ? <><span className="spinner" /> Finding new picks…</> : 'Try different picks →'}
        </button>
        <button className="ghost-btn" onClick={onReset}>Start over</button>
      </div>
    </div>
  );
}
