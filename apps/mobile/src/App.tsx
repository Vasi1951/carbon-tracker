import React, { useState, Suspense } from 'react';
import { SafeAreaView, Text, View } from 'react-native';

const HomeScreen = React.lazy(() => import('./screens/HomeScreen.js'));
const AddActivityScreen = React.lazy(() => import('./screens/AddActivityScreen.js'));

export default function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState('Home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen setScreen={setCurrentScreen} />;
      case 'AddActivity':
        return <AddActivityScreen setScreen={setCurrentScreen} />;
      default:
        return <HomeScreen setScreen={setCurrentScreen} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121214' }}>
      <Suspense fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff' }} accessibilityRole="text" aria-live="polite">Loading...</Text>
        </View>
      }>
        {renderScreen()}
      </Suspense>
    </SafeAreaView>
  );
}
