import { useState } from 'react';
import Home from './screens/Home';
import Result from './screens/Result';
import History from './screens/History';
import { PreferenceMap, RecommendResponse, Screen } from './types';

interface ResultData {
  response: RecommendResponse;
  preferences: PreferenceMap;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [sessionExcludes, setSessionExcludes] = useState<string[]>([]);

  const handleResult = (data: ResultData) => {
    setResultData(data);
    setScreen('result');
    setSessionExcludes((prev) => [...prev, data.response.category]);
  };

  const handleReset = () => {
    setResultData(null);
    setSessionExcludes([]);
    setScreen('home');
  };

  if (screen === 'result' && resultData) {
    return (
      <Result
        category={resultData.response.category}
        reason={resultData.response.reason}
        imageUrl={resultData.response.image_url}
        preferences={resultData.preferences}
        excludes={sessionExcludes}
        onResult={handleResult}
        onReset={handleReset}
        onHistory={() => setScreen('history')}
      />
    );
  }

  if (screen === 'history') {
    return <History onBack={() => setScreen('home')} />;
  }

  return (
    <Home
      onResult={(data) => handleResult({ response: data.response, preferences: data.preferences })}
      onHistory={() => setScreen('history')}
    />
  );
}
