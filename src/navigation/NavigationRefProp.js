// import * as React from 'react';
// import {CommonActions} from '@react-navigation/native';
// import database from '@react-native-firebase/database';
// import Storage from '../constants/Storage';

// export const navigationRef = React.createRef();

// export function navigate(name, params) {
//   navigationRef.current?.navigate(name, params);
// }

// export function logoutUserFromStack() {
//   Storage.clearAll().then(() => {
//     navigationRef.current?.dispatch(
//       CommonActions.reset({
//         index: 0,
//         routes: [{name: 'SocialLoginScreen'}],
//       }),
//     );
//   });
// }


import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import Storage from '../constants/Storage';

export const navigationRef = createNavigationContainerRef(); // ✅ updated

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function logoutUserFromStack() {
  Storage.clearAll().then(() => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'SocialLoginScreen' }],
        }),
      );
    }
  });
}
