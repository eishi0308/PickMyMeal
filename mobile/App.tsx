import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Landing from './src/screens/Landing';
import Home from './src/screens/Home';
import Result from './src/screens/Result';
import Order from './src/screens/Order';
import CookGateway from './src/screens/CookGateway';
import CookAlternative from './src/screens/CookAlternative';
import CookExact from './src/screens/CookExact';
import History from './src/screens/History';
import { PreferenceMap, RecommendResponse, Screen, CookAlternativeResponse, CookExactResponse } from './src/types';
import { getCookAlternative, getCookExact, generateImage } from './src/api/foodApi';

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
    // Pre-fetch cook alternative + exact recipe while user reads the result
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
          .then(img => setCookAltImage(img.image_url ?? null));
      })
      .catch(() => setCookLoading(false));
    setExactData(null);
    setExactError(false);
    setExactLoading(true);
    getCookExact(best)
      .then(d => { setExactData(d); setExactLoading(false); })
      .catch(() => { setExactError(true); setExactLoading(false); });
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
            .then(img => setCookAltImage(img.image_url ?? null));
        })
        .catch(() => setCookLoading(false));
      setExactData(null);
      setExactError(false);
      setExactLoading(true);
      getCookExact(category)
        .then(d => { setExactData(d); setExactLoading(false); })
        .catch(() => { setExactError(true); setExactLoading(false); });
    }
  };

  const handleChooseExact = () => {
    setScreen('cook-exact');
    if ((!exactData || !exactData.delivery_estimate) && !exactLoading) {
      setExactData(null);
      setExactError(false);
      setExactLoading(true);
      getCookExact(orderCategory)
        .then(d => { setExactData(d); setExactLoading(false); })
        .catch(() => { setExactError(true); setExactLoading(false); });
    }
  };

  const handleRetryExact = () => {
    setExactData(null);
    setExactLoading(true);
    setExactError(false);
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

  const handleToggle = (key: string, option: string) => {
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
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        {screen === 'landing' && (
          <Landing onStart={() => setScreen('home')} onHistory={handleHistory} />
        )}

        {screen === 'home' && (
          <Home
            selected={selected}
            initialMode={homeMode}
            lastResultNames={resultData ? [resultData.response.category, ...resultData.backups.map(b => b.category)] : []}
            onToggle={handleToggle}
            onResult={handleResult}
            onBackToResult={() => setScreen('result')}
            onHistory={handleHistory}
            onLogoClick={() => setScreen('landing')}
          />
        )}

        {screen === 'result' && resultData && (
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
        )}

        {screen === 'cook-gateway' && (
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
        )}

        {screen === 'cook' && (
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
        )}

        {screen === 'cook-exact' && (
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
        )}

        {screen === 'order' && (
          <Order
            category={orderCategory}
            imageUrl={orderImage}
            onBack={() => setScreen('result')}
            onReset={handleReset}
            onLogoClick={() => setScreen('landing')}
          />
        )}

        {screen === 'history' && (
          <History
            onBack={() => setScreen(previousScreen)}
            onLogoClick={() => setScreen('landing')}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
});
