import { useState } from 'react';
import Landing from './screens/Landing';
import Home from './screens/Home';
import Result from './screens/Result';
import History from './screens/History';
import { PreferenceMap, RecommendResponse, Screen } from './types';

interface ResultData {
  response: RecommendResponse;
  preferences: PreferenceMap;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');
  const [selected, setSelected] = useState<PreferenceMap>({});
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [sessionExcludes, setSessionExcludes] = useState<string[]>([]);

  const handleResult = (data: ResultData) => {
    setResultData(data);
    setScreen('result');
    setSessionExcludes((prev) => [...prev, data.response.category]);
  };

  const handleHistory = () => {
    setPreviousScreen(screen);
    setScreen('history');
  };

  const handleReset = () => {
    setSelected({});
    setResultData(null);
    setSessionExcludes([]);
    setScreen('home');
  };

  if (screen === 'landing') {
    return (
      <Landing
        onStart={() => setScreen('home')}
        onHistory={handleHistory}
      />
    );
  }

  if (screen === 'result' && resultData) {
    return (
      <Result
        category={resultData.response.category}
        reason={resultData.response.reason}
        imageUrl={resultData.response.image_url}
        preferences={resultData.preferences}
        excludes={sessionExcludes}
        onResult={handleResult}
        onBack={() => setScreen('home')}
        onReset={handleReset}
        onHistory={handleHistory}
        onLogoClick={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'history') {
    return (
      <History
        onBack={() => setScreen(previousScreen)}
        onLogoClick={() => setScreen('landing')}
      />
    );
  }

  return (
    <Home
      selected={selected}
      onToggle={(key, option) =>
        setSelected((prev) => {
          if (prev[key] === option) {
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return { ...prev, [key]: option };
        })
      }
      onResult={(data) => handleResult({ response: data.response, preferences: data.preferences })}
      onHistory={handleHistory}
      onLogoClick={() => setScreen('landing')}
    />
  );
}
