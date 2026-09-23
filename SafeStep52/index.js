import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import App from './App';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Mensaje en segundo plano:', remoteMessage);
});

registerRootComponent(App);