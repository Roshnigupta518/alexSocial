import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  // SafeAreaView,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform, StatusBar
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AppStack from './navigation/AppStack';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import FlashMessage from 'react-native-flash-message';
import SplashScreen from 'react-native-splash-screen';
import {colors, HEIGHT, wp} from './constants';
import ImageConstants from './constants/ImageConstants';
import Storage from './constants/Storage';
import {useDispatch, useSelector} from 'react-redux';
import {userDataAction} from './redux/Slices/UserInfoSlice';
import database from '@react-native-firebase/database';
import Toast from './constants/Toast';
import {ChatListAction} from './redux/Slices/ChatListSlice';
import {OnlineUserAction} from './redux/Slices/OnlineUserSlice';
import NoInternetModal from './components/NoInternetModal';
import NetInfo from '@react-native-community/netinfo';
import {navigationRef} from './navigation/NavigationRefProp';
import RequestNotificationPermission from './constants/NotificationPermission';
import { request, PERMISSIONS, check, RESULTS } from 'react-native-permissions';
// import AppUpdateChecker from './components/AppUpdateChecker';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { Linking } from 'react-native';

const App = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector(state => state.UserInfoSlice.data);
  const [isLoading, setIsLoading] = useState(false);
  const [isInternetConnected, setIsInternetConnected] = useState(true);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);

  const onlineUserRef = database().ref(`/online-users`);
  const childRef = database().ref(`/online-users/${userInfo?.id}`);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected !== null && state.isConnected === false) {
        // Set internet connection status to false when not connected
        setIsInternetConnected(false);
        console.log('No internet connection');
      } else if (
        state.isConnected === true &&
        state.isInternetReachable !== undefined
      ) {
        // Only update when connection is reachable
        console.log(
          'State of Internet reachability: ',
          state.isInternetReachable,
        );

        // Set connection status based on reachability
        setIsInternetConnected(state.isInternetReachable);
      }
    });

    // Unsubscribe
    return () => unsubscribe();
  }, []);
  const getUserChat = () => {
    try {
      // console.log('calling user chat function********************')
      let reference = database().ref('/recent_chat');
      // console.log('*****************reference', reference)
      reference.on('value', snapshot => {
        // console.log('Got snapshot from database', snapshot.val());
        dispatch(ChatListAction(JSON.stringify(snapshot)));
      });
    } catch (err) {
      console.log('getUserChat error:', err);
    }
  };
  

  const getUserInfo = async () => {
    setIsLoading(true);
    await Storage.get('userdata')
      .then(res => {
        if (res) {
          dispatch(userDataAction(res));
          setIsLoggedInUser(true);
        } else {
          dispatch(userDataAction(null));
          setIsLoggedInUser(false);
        }
      })
      .finally(() => {
        // RequestNotificationPermission().finally(() => {
          setIsLoading(false);
        // });
      });
  };

  const setupOnDisconnect = async () => {
    await childRef.onDisconnect().remove();
  };

  useEffect(() => {
    onlineUserRef.on('value', snapshot => {
      let data = snapshot.val();
      dispatch(OnlineUserAction(data));
    });

    if (userInfo?.id != undefined) {
      setupOnDisconnect().then(() => {
        childRef.set(true);
      });
    }
  }, [userInfo]);


  const requestIOSPermissions = async () => {
    const permissionsToRequest = [
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.MICROPHONE,
      PERMISSIONS.IOS.PHOTO_LIBRARY,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      PERMISSIONS.IOS.LOCATION_ALWAYS,
    ];
  
    for (let permission of permissionsToRequest) {
      try {
        const result = await request(permission);
        console.log(`Permission ${permission} result:`, result);
      } catch (err) {
        console.warn(`Error requesting ${permission}`, err);
      }
    }
  
    // Add slight delay before requesting notifications
    setTimeout(() => {
      RequestNotificationPermission().finally(() => {
        console.log('Notification permission flow completed.');
      });
    }, 1000); // delay in ms
  };
  

  const GetRequiredPermissions = async () => {
    try {
      let permissionArr =
        Platform.Version >= 33
          ? [
              PermissionsAndroid.PERMISSIONS.CAMERA,
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            ]
          : [
              PermissionsAndroid.PERMISSIONS.CAMERA,
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            ];

      const granted = await PermissionsAndroid.requestMultiple(permissionArr, {
        title: 'Cool Photo App Camera Permission',
        message:
          'Cool Photo App needs access to your camera ' +
          'so you can take awesome pictures.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      GetRequiredPermissions();
      RequestNotificationPermission(); // For Android, it's okay to call right away
    } else if (Platform.OS === 'ios') {
      requestIOSPermissions(); // Will handle all iOS permissions including notification
    }
    getUserInfo();
    getUserChat();

    setTimeout(() => {
      SplashScreen.hide();
    }, 2000);
  }, []);

  const HandleDeepLink = () => {
    const handleLink = async (link) => {
      try {
        const url = link?.url;
        if (!url) return;
  
        console.log('Received deep link:', url);
  
        const urlParts = url.split('/');
        const type = urlParts[urlParts.length - 2]; // 'business' or 'post'
        const id = urlParts[urlParts.length - 1];
  
        if (navigationRef.isReady()) {
          if (type === 'business') {
            navigationRef.navigate('ClaimBusinessScreen', { place_id: id });
          } else if (type === 'post') {
            navigationRef.navigate('PostDetailScreen', { post_id: id }); // Make sure this screen exists
          } else if (type === 'story'){
            navigationRef.navigate('Home', { openStoryId: id });
            console.log('going to home screen with story id', id)
          }
        } else {
          // Wait for nav readiness
          const interval = setInterval(() => {
            if (navigationRef.isReady()) {
              clearInterval(interval);
              if (type === 'business') {
                navigationRef.navigate('ClaimBusinessScreen', { place_id: id });
              } else if (type === 'post') {
                navigationRef.navigate('PostDetailScreen', { post_id: id });
              } else if (type === 'story'){
                navigationRef.navigate('Home', { openStoryId: id });
              }
            }
          }, 100);
        }
  
      } catch (error) {
        console.log('Deep link handler error:', error);
      }
    };
  
    useEffect(() => {
      const unsubscribe = dynamicLinks().onLink(handleLink);
      dynamicLinks()
        .getInitialLink()
        .then(link => {
          if (link?.url) handleLink(link);
        });
  
      return () => unsubscribe();
    }, []);
  
    return null;
  };

  return (
    <SafeAreaProvider>
  <SafeAreaView 
    style={{flex: 1, backgroundColor:'black'}} 
    edges={['top']}   // 👈 sirf top ke liye safe area apply hoga
  >
          {/* <StatusBar barStyle="light-content" backgroundColor="black" /> */}

      {isLoading ? (
        <View style={styles.container}>
          <Image source={ImageConstants.appIcon} style={styles.iconStyles} />
        </View>
      ) : (
        <NavigationContainer ref={navigationRef}>
          <StatusBar barStyle="light-content" backgroundColor="black" translucent={false} />
          <HandleDeepLink />
          <AppStack isLoggedIn={isLoggedInUser} />
        </NavigationContainer>
      )}
      {/* <AppUpdateChecker /> */}
      <FlashMessage position="top" style={{zIndex: 2, paddingTop:Platform.OS == 'android' ? 30: null }} />
      {/* <NoInternetModal shouldShow={!isInternetConnected} /> */}
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryColor,
  },

  iconStyles: {
    height: HEIGHT / 4,
    width: HEIGHT / 4,
  },
});

export default App;
