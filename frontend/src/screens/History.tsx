import { useState, useEffect } from 'react';
import { getHistory, clearHistory } from '../api/history';
import { HistoryEntry } from '../types';

interface Props {
  onBack: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function History({ onBack }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2 className="history-title">History</h2>
        {entries.length > 0 && (
          <button className="clear-btn" onClick={handleClear}>
            Clear all
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">🍽</div>
          <p>No decisions yet.</p>
          <p>Go make your first one.</p>
        </div>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <div key={entry.id} className="history-item">
              <div className="history-item-header">
                <span className="history-item-category">{entry.category}</span>
                <span className="history-item-time">{formatDate(entry.timestamp)}</span>
              </div>
              <div className="history-item-moods">
                {Object.entries(entry.preferences).map(([, value]) => (
                  <span key={value} className="history-mood-tag">
                    {value}
                  </span>
                ))}
              </div>
              <p className="history-item-reason">{entry.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
