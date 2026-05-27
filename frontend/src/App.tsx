import { useState } from 'react';
import Landing from './screens/Landing';
import Home from './screens/Home';
import Result from './screens/Result';
import Order from './screens/Order';
import CookGateway from './screens/CookGateway';
import CookAlternative from './screens/CookAlternative';
import CookExact from './screens/CookExact';
import History from './screens/History';
import { PreferenceMap, RecommendResponse, Screen, CookAlternativeResponse, CookExactResponse } from './types';
import { getCookAlternative, getCookExact, generateImage } from './api/foodApi';

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
  const [cookData, setCookData] = useState<CookAlternativeResponse | null>(null);
  const [cookLoading, setCookLoading] = useState(false);
  const [cookForCategory, setCookForCategory] = useState<string>('');
  const [cookAltImage, setCookAltImage] = useState<string | null>(null);
  const [exactData, setExactData] = useState<CookExactResponse | null>(null);
  const [exactLoading, setExactLoading] = useState(false);
  const [exactError, setExactError] = useState(false);

  const handleResult = (data: ResultData) => {
    setResultData(data);
    setScreen('result');
    setSessionExcludes((prev) => [
      ...prev,
      data.response.category,
      ...data.backups.map((b) => b.category),
    ]);
    // Pre-fetch cook alternative for best pick while user reads the result
    const best = data.response.category;
    setCookData(null);
    setCookLoading(true);
    setCookAltImage(null);
    setCookForCategory(best);
    getCookAlternative(best)
      .then(d => {
        setCookData(d);
        setCookLoading(false);
        generateImage(d.alternative_name, d.alternative_name)
          .then(img => setCookAltImage(img.image_url));
      })
      .catch(() => setCookLoading(false));
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

  const handleCook = (category: string, imageUrl: string | null = null) => {
    setOrderCategory(category);
    setOrderImage(imageUrl);
    setScreen('cook-gateway');
    // Pre-fetch easy version if not already done
    if (category !== cookForCategory) {
      setCookData(null);
      setCookLoading(true);
      setCookAltImage(null);
      setCookForCategory(category);
      getCookAlternative(category)
        .then(d => {
          setCookData(d);
          setCookLoading(false);
          generateImage(d.alternative_name, d.alternative_name)
            .then(img => setCookAltImage(img.image_url));
        })
        .catch(() => setCookLoading(false));
    }
    // Reset exact recipe state for fresh fetch on demand
    setExactData(null);
    setExactError(false);
  };

  const handleChooseExact = () => {
    setScreen('cook-exact');
    setExactData(null);
    setExactError(false);
    setExactLoading(true);
    getCookExact(orderCategory)
      .then(d => { setExactData(d); setExactLoading(false); })
      .catch(() => { setExactError(true); setExactLoading(false); });
  };

  const handleRetryExact = () => {
    setExactData(null);
    setExactError(false);
    setExactLoading(true);
    getCookExact(orderCategory)
      .then(d => { setExactData(d); setExactLoading(false); })
      .catch(() => { setExactError(true); setExactLoading(false); });
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
        onLogoClick={() => setScreen('landing')}
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
        onOrder={(cat, img) => handleCook(cat, img)}
        onDirectOrder={(cat, img) => handleOrder(cat, img)}
        onTune={handleTune}
      />
    );
  }

  if (screen === 'cook-gateway') {
    return (
      <CookGateway
        category={orderCategory}
        imageUrl={orderImage}
        easyData={cookData}
        easyLoading={cookLoading}
        onChooseEasy={() => setScreen('cook')}
        onChooseExact={handleChooseExact}
        onBack={() => setScreen('result')}
        onLogoClick={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'cook') {
    return (
      <CookAlternative
        category={orderCategory}
        imageUrl={orderImage}
        prefetchedData={cookData}
        prefetchLoading={cookLoading}
        prefetchedAltImage={cookAltImage}
        onOrder={handleOrder}
        onBack={() => setScreen('cook-gateway')}
        onReset={handleReset}
        onLogoClick={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'cook-exact') {
    return (
      <CookExact
        category={orderCategory}
        imageUrl={orderImage}
        data={exactData}
        loading={exactLoading}
        error={exactError}
        onRetry={handleRetryExact}
        onSwitchToEasy={() => setScreen('cook')}
        onOrder={handleOrder}
        onBack={() => setScreen('cook-gateway')}
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
      initialMode={homeMode}
      lastResultNames={resultData ? [resultData.response.category, ...resultData.backups.map(b => b.category)] : []}
      onToggle={(key, option) =>
        setSelected((prev) => {
          if (key.startsWith('avoid_')) {
            const current = prev[key] ? prev[key].split(',') : [];
            if (current.includes(option)) {
              const next = current.filter(o => o !== option);
              if (next.length === 0) { const n = { ...prev }; delete n[key]; return n; }
              return { ...prev, [key]: next.join(',') };
            }
            return { ...prev, [key]: [...current, option].join(',') };
          }
          if (prev[key] === option) { const n = { ...prev }; delete n[key]; return n; }
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
