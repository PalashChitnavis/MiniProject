import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { Buffer } from 'buffer';
if (!global.Buffer) {
  global.Buffer = Buffer;
}
const App = () => {
  return <AppNavigator />;
};

export default App;
