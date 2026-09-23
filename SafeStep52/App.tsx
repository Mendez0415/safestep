import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNotifications, connectMQTT } from './src/services/mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

export default function App() {
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    // Pedir permisos de notificaciones
    await messaging().requestPermission();

    // Obtener token FCM y guardarlo
    const token = await messaging().getToken();
    await AsyncStorage.setItem('fcm_token', token);
    console.log('FCM Token:', token);

    // Notificaciones en segundo plano
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Notificación en segundo plano:', remoteMessage);
    });

    // Notificaciones en primer plano
    messaging().onMessage(async remoteMessage => {
      console.log('Notificación en primer plano:', remoteMessage);
    });

    await setupNotifications();
    const savedPass = await AsyncStorage.getItem('mqtt_password');
    if (savedPass) {
      connectMQTT(savedPass);
    }
  };

  return <AppNavigator />;
}