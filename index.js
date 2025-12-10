/**
 * @format
 */
import 'react-native-reanimated'; // ✅ MANDATORY - MUST be at top
import 'react-native-permissions';
import 'react-native-get-random-values';
import 'react-native-gesture-handler'

import {AppRegistry, LogBox} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import {Provider} from 'react-redux';
import Store from './src/redux/Store';
import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import {logoutUserFromStack} from './src/navigation/NavigationRefProp';
import {showMessage} from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableExperimentalWorkletReentrancyFix } from 'react-native-reanimated';
import { enableFreeze } from 'react-native-screens';
enableFreeze(true);  // Screen unmount pe crash rokta hai

// Add this line – it disables the aggressive reentrancy check that crashes
enableExperimentalWorkletReentrancyFix?.();

messaging().onNotificationOpenedApp(remoteMessage => {
  console.log(
    'Notification caused app to open from background state:',
    remoteMessage.notification,
  );
  if (remoteMessage?.data?.type == 'logout') {
    logoutUserFromStack();
  }
});

messaging().onMessage(async remoteMessage => {
  console.log('recieved in foreground', remoteMessage);
  if (remoteMessage?.data?.type == 'logout') {
    showMessage('Sucessfully', remoteMessage?.notification?.body);
    logoutUserFromStack();
  }
});

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  if (remoteMessage?.data?.type == 'logout') {
    logoutUserFromStack();
  }
});

// Check whether an initial notification is available
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      console.log(
        'Notification caused app to open from quit state:',
        remoteMessage.notification,
      );
      if (remoteMessage?.data?.type == 'logout') {
        logoutUserFromStack();
      }
      //   setInitialRoute(remoteMessage.data.type); // e.g. "Settings"
    }
    // setLoading(false);
  });

const AppWrapper = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={Store}>
        <App />
      </Provider>
    </GestureHandlerRootView>
  );
};
LogBox.ignoreAllLogs(true);
AppRegistry.registerComponent(appName, () => AppWrapper);
