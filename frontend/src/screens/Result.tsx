import { useState, useEffect } from 'react';
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
  onOrder: (category: string, imageUrl: string | null) => void;
  onDirectOrder: (category: string, imageUrl: string | null) => void;
  onTune: () => void;
}

function ImageSlot({ src, alt }: { src: string | null; alt: string }) {
  const fb = `https://loremflickr.com/600/400/food,${encodeURIComponent(alt)}`;
  if (!src) {
    return <div className="image-shimmer" />;
  }
  return (
    <img
      className="primary-image image-fade-in"
      src={src}
      alt={alt}
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = fb; }}
    />
  );
}

export default function Result({
  best, backups, preferences, excludes,
  onResult, onBack, onReset, onHistory, onLogoClick, onOrder, onDirectOrder, onTune,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [expandedBackups, setExpandedBackups] = useState<Set<number>>(new Set());
  const [bestImage, setBestImage] = useState<string | null>(null);
  const [backupImages, setBackupImages] = useState<(string | null)[]>([null, null]);

  const fallbackUrl = `https://loremflickr.com/600/400/food,${encodeURIComponent(best.category)}`;

  // Reset and reload images whenever picks change
  useEffect(() => {
    setBestImage(null);
    setBackupImages([null, null]);
    generateImage(best.category, best.category).then(img => {
      setBestImage(img.image_url);
    });
    backups.forEach((backup, i) => {
      generateImage(backup.category, backup.category).then(img => {
        setBackupImages(prev => {
          const next = [...prev];
          next[i] = img.image_url;
          return next;
        });
      });
    });
  }, [best.category]);

  const handleTryAgain = async () => {
    setLoading(true);
    setExpandedBackups(new Set());
    try {
      const currentShown = [best.category, ...backups.map(b => b.category)];
      const newExcludes = [...new Set([...excludes, ...currentShown])];
      const r1 = await recommend({ preferences, exclude: newExcludes });
      const r2 = await recommend({ preferences, exclude: [...newExcludes, r1.category] });
      const r3 = await recommend({ preferences, exclude: [...newExcludes, r1.category, r2.category] });
      addToHistory({ preferences, category: r1.category, reason: r1.reason });
      onResult({ response: r1, backups: [r2, r3], preferences });
    } finally {
      setLoading(false);
    }
  };

  const toggleBackup = (i: number) =>
    setExpandedBackups(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="screen result-screen">
      <NavBar onLogoClick={onLogoClick} onBack={onBack} onHistory={onHistory} />

      {/* Primary card */}
      <div className="primary-card">
        <div className="primary-badge">⭐ Best Pick</div>
        <h1 className="primary-title">{best.category}</h1>
        <div className="primary-image-wrap">
          <ImageSlot src={bestImage} alt={best.category} />
        </div>
        <p className="primary-reason">{best.reason}</p>
        <div className="result-dual-cta">
          <button className="cook-btn" onClick={() => onOrder(best.category, bestImage)}>
            🏠 Cook at home
          </button>
          <button className="ubereats-btn" onClick={() => onDirectOrder(best.category, bestImage)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 110 16A8 8 0 0112 4zm-1 4v4.586l-2.293-2.293-1.414 1.414L12 16.414l4.707-4.707-1.414-1.414L13 12.586V8h-2z"/></svg>
            Order on Uber Eats
          </button>
        </div>
      </div>

      {/* Backups — compact list, accordion */}
      <div className="backups-compact">
        <p className="backups-compact-label">Or try:</p>
        {backups.map((item, i) => {
          const isExpanded = expandedBackups.has(i);

          return (
            <div key={i}>
              {isExpanded ? (
                <div className="primary-card backup-expanded-card">
                  <button className="backup-collapse-btn" onClick={() => toggleBackup(i)}>
                    <span className="primary-badge">#{i + 2} Pick</span>
                    <span className="backup-collapse-arrow">↑ Close</span>
                  </button>
                  <h2 className="primary-title">{item.category}</h2>
                  <div className="primary-image-wrap">
                    <ImageSlot src={backupImages[i]} alt={item.category} />
                  </div>
                  <p className="primary-reason">{item.reason}</p>
                  <div className="result-dual-cta">
                    <button className="cook-btn" onClick={() => onOrder(item.category, backupImages[i])}>
                      🏠 Cook at home
                    </button>
                    <button className="ubereats-btn" onClick={() => onDirectOrder(item.category, backupImages[i])}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 110 16A8 8 0 0112 4zm-1 4v4.586l-2.293-2.293-1.414 1.414L12 16.414l4.707-4.707-1.414-1.414L13 12.586V8h-2z"/></svg>
                      Order on Uber Eats
                    </button>
                  </div>
                </div>
              ) : (
                <button className="backup-row" onClick={() => toggleBackup(i)}>
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

      {/* Tune it */}
      <div className="tune-section">
        <p className="tune-hook">Not quite right?</p>
        <p className="tune-hook-sub">Tell us exactly what you want — we'll nail it.</p>
        <button className="tune-btn" onClick={onTune}>
          <span className="tune-btn-title">🎛 Make it perfect for you</span>
          <span className="tune-btn-arrow">→</span>
        </button>
      </div>

      {/* Bottom actions */}
      <div className="result-actions">
        <button className="try-again-btn" onClick={handleTryAgain} disabled={loading}>
          {loading ? <><span className="spinner" />Finding new picks…</> : '↻  Show me different picks'}
        </button>
        <button className="ghost-btn" onClick={onReset}>× Start over</button>
      </div>
    </div>
  );
}
