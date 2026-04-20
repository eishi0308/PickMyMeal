import { useState } from 'react';
import Landing from './screens/Landing';
import Home from './screens/Home';
import Result from './screens/Result';
import Order from './screens/Order';
import History from './screens/History';
import { PreferenceMap, RecommendResponse, Screen } from './types';

interface ResultData {
  response: RecommendResponse;
  backups: RecommendResponse[];
  preferences: PreferenceMap;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');
  const [selected, setSelected] = useState<PreferenceMap>({});
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [sessionExcludes, setSessionExcludes] = useState<string[]>([]);
  const [orderCategory, setOrderCategory] = useState<string>('');
  const [orderImage, setOrderImage] = useState<string | null>(null);
  const [homeMode, setHomeMode] = useState<'quick' | 'fine'>('quick');

  const handleResult = (data: ResultData) => {
    setResultData(data);
    setScreen('result');
    setSessionExcludes((prev) => [
      ...prev,
      data.response.category,
      ...data.backups.map((b) => b.category),
    ]);
  };

  const handleHistory = () => {
    setPreviousScreen(screen);
    setScreen('history');
  };

  const handleReset = () => {
    setSelected({});
    setResultData(null);
    setSessionExcludes([]);
    setHomeMode('quick');
    setScreen('home');
  };

  const handleOrder = (category: string, imageUrl: string | null = null) => {
    setOrderCategory(category);
    setOrderImage(imageUrl);
    setScreen('order');
  };

  const handleTune = () => {
    setHomeMode('fine');
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

  if (screen === 'order') {
    return (
      <Order
        category={orderCategory}
        imageUrl={orderImage}
        onBack={() => setScreen('result')}
        onReset={handleReset}
      />
    );
  }

  if (screen === 'result' && resultData) {
    return (
      <Result
        best={resultData.response}
        backups={resultData.backups}
        preferences={resultData.preferences}
        excludes={sessionExcludes}
        onResult={handleResult}
        onBack={() => setScreen('home')}
        onReset={handleReset}
        onHistory={handleHistory}
        onLogoClick={() => setScreen('landing')}
        onOrder={(cat, img) => handleOrder(cat, img)}
        onTune={handleTune}
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
      initialMode={homeMode}
      lastResultNames={resultData ? [resultData.response.category, ...resultData.backups.map(b => b.category)] : []}
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
      onResult={(data) => handleResult({ response: data.response, backups: data.backups, preferences: data.preferences })}
      onBackToResult={() => setScreen('result')}
      onHistory={handleHistory}
      onLogoClick={() => setScreen('landing')}
    />
  );
}
