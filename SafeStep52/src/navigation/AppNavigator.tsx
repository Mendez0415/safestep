import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ConfigScreen from '../screens/ConfigScreen';
import WifiSetupScreen from '../screens/WifiSetupScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Config" component={ConfigScreen} />
        <Stack.Screen name="WifiSetup" component={WifiSetupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
