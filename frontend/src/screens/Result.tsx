import { useState } from 'react';
import { recommend, generateImage, preloadImage } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';

interface ResultData {
  response: RecommendResponse;
  preferences: PreferenceMap;
}

interface Props {
  category: string;
  reason: string;
  imageUrl: string | null;
  preferences: PreferenceMap;
  excludes: string[];
  onResult: (data: ResultData) => void;
  onReset: () => void;
  onHistory: () => void;
}

export default function Result({ category, reason, imageUrl, preferences, excludes, onResult, onReset, onHistory }: Props) {
  const uberEatsUrl = `https://www.ubereats.com/search?q=${encodeURIComponent(category)}`;
  const fallbackUrl = `https://loremflickr.com/600/400/food,${encodeURIComponent(category)}`;
  const [moreLoading, setMoreLoading] = useState(false);

  const handleSurpriseMe = async () => {
    setMoreLoading(true);
    try {
      const response = await recommend({ preferences, exclude: excludes });
      const imageRes = await generateImage(response.category, response.category);
      response.image_url = imageRes.image_url;
      if (response.image_url) await preloadImage(response.image_url);
      addToHistory({ preferences, category: response.category, reason: response.reason });
      onResult({ response, preferences });
    } finally {
      setMoreLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onReset}>
          ← Back
        </button>
      </div>

      <div className="result-body">
        <div className="result-eyebrow">Your food today</div>
        <div className="result-category">{category}</div>

        <div className="result-image-container">
          <img
            className="result-image"
            src={imageUrl ?? fallbackUrl}
            alt={category}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackUrl;
            }}
          />
        </div>

        <p className="result-reason">{reason}</p>

        <div className="result-actions">
          <a
            href={uberEatsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ubereats-btn"
          >
            Open on Uber Eats →
          </a>
          <button
            className="decide-btn"
            onClick={handleSurpriseMe}
            disabled={moreLoading}
          >
            {moreLoading ? (
              <>
                <span className="spinner" />
                Finding something different…
              </>
            ) : (
              'Try a different one →'
            )}
          </button>
          <button className="ghost-btn" onClick={onReset}>
            Change picks
          </button>
          <button className="ghost-btn" onClick={onHistory}>
            History
          </button>
        </div>
      </div>
    </div>
  );
}
