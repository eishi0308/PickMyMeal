import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Landing from './src/screens/Landing';
import Home from './src/screens/Home';
import Result from './src/screens/Result';
import Order from './src/screens/Order';
import History from './src/screens/History';
import { PreferenceMap, RecommendResponse, Screen } from './src/types';

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

  const handleToggle = (key: string, option: string) => {
    setSelected((prev) => {
      if (prev[key] === option) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
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
            onOrder={(cat, img) => handleOrder(cat, img)}
            onTune={handleTune}
          />
        )}

        {screen === 'order' && (
          <Order
            category={orderCategory}
            imageUrl={orderImage}
            onBack={() => setScreen('result')}
            onReset={handleReset}
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
