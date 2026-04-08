import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Landing from './src/screens/Landing';
import Home from './src/screens/Home';
import Result from './src/screens/Result';
import History from './src/screens/History';
import { PreferenceMap, RecommendResponse, Screen } from './src/types';

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
          onToggle={handleToggle}
          onResult={handleResult}
          onHistory={handleHistory}
          onLogoClick={() => setScreen('landing')}
        />
      )}

      {screen === 'result' && resultData && (
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
