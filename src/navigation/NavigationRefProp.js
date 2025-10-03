import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
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
