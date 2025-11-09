import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  BackHandler,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ImageConstants from '../../constants/ImageConstants';
import {colors, fonts, HEIGHT, wp} from '../../constants';
import { getAuth, GoogleAuthProvider, signInWithCredential, FacebookAuthProvider, OAuthProvider, AppleAuthProvider } from 'firebase/auth';
import { firebaseApp } from '../../../firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import {SocialLoginRequest} from '../../services/Utills';
import {
  AppleButton,
  appleAuth,
} from '@invertase/react-native-apple-authentication';
import Toast from '../../constants/Toast';
import {useDispatch, useSelector} from 'react-redux';
import {userDataAction} from '../../redux/Slices/UserInfoSlice';
import {LoginManager, AccessToken, Settings} from 'react-native-fbsdk-next';
import {CommonActions} from '@react-navigation/native';
import Storage from './../../constants/Storage';
import {getFCMToken} from '../../constants/FCMGeneration';
import NetInfo from '@react-native-community/netinfo';
import NoInternetModal from '../../components/NoInternetModal';
import CustomContainer from '../../components/container';
import crashlytics from '@react-native-firebase/crashlytics';
const SocialLoginScreen = ({navigation}) => {
  const auth = getAuth(firebaseApp);

  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFor, setLoadingFor] = useState('');
  const [fcmToken, setFcmToken] = useState('');
  const userInfo = useSelector(state => state.UserInfoSlice.data);
  const [isInternetConnected, setIsInternetConnected] = useState(true);

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
  GoogleSignin.configure({
    webClientId:
      '859541725168-s116r4rg7fkcn9b6b43a93kcu0k16aoc.apps.googleusercontent.com',
  });

  const buttonList = [
    {
      type: 'email',
      icon: ImageConstants.person,
      title: 'Continue with Email/Mobile Number',
      action: () => navigation.navigate('LoginScreen'),
    },
    {
      type: 'fb',
      icon: ImageConstants.facebook,
      title: 'Continue with Facebook',
      action: () =>
        onFacebookButtonPress()
          .then(res => MakeFbUserLogin(res))
          .catch(() => {
            setIsLoading(false);
            setLoadingFor('');
          }),
    },
    {
      type: 'google',
      icon: ImageConstants.google,
      title: 'Continue with Google',
      action: () =>
        onGoogleButtonPress()
          .then(userCredential => {
            console.log('Google user logged in:', userCredential.user);
            MakeUserLogin(true);
          })
          .catch(err => {
            console.log('Google login failed:', err);
            setIsLoading(false);
            setLoadingFor('');
          }),
    },

    
    {
      type: 'apple',
      icon: ImageConstants.apple,
      title: 'Continue with Apple',
      action: () =>
        onAppleButtonPress()
          .then(res => {
            console.log({res})
            if (!res) {
              // 🚫 Skip API call when Apple Sign-In was cancelled or failed
              console.log('Apple Sign-In cancelled or failed — skipping API call');
              return;
            }
            MakeAppleLoginUser(res);
          })
          .catch(() => {
            setIsLoading(false);
            setLoadingFor('');
          }),
    },
  ];

  // async function onAppleButtonPress() {
  //   setIsLoading(true);
  //   setLoadingFor('apple');
  //   // Start the sign-in request
  //   const appleAuthRequestResponse = await appleAuth.performRequest({
  //     requestedOperation: appleAuth.Operation.LOGIN,
  //     // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
  //     // See: https://github.com/invertase/react-native-apple-authentication#faqs
  //     requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  //   });

  //   // Ensure Apple returned a user identityToken
  //   if (!appleAuthRequestResponse.identityToken) {
  //     setIsLoading(false);
  //     setLoadingFor('');
  //     // Log the error with Crashlytics

  //     throw new Error('Apple Sign-In failed - no identify token returned');
  //   }

  //   // Create a Firebase credential from the response
  //   const {identityToken, nonce} = appleAuthRequestResponse;
  //   const appleCredential = auth.AppleAuthProvider.credential(
  //     identityToken,
  //     nonce,
  //   );

  //   // Sign the user in with the credential
  //   return auth().signInWithCredential(appleCredential);
  // }

  // async function onAppleButtonPress() {
  //   try {
  //     setIsLoading(true);
  //     setLoadingFor('apple');
  
  //     // 1️⃣ Start the Apple sign-in request
  //     const appleAuthRequestResponse = await appleAuth.performRequest({
  //       requestedOperation: appleAuth.Operation.LOGIN,
  //       requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  //     });
  
  //     // 2️⃣ Ensure identityToken is returned
  //     if (!appleAuthRequestResponse.identityToken) {
  //       setIsLoading(false);
  //       setLoadingFor('');
  //       throw new Error('Apple Sign-In failed - no identity token returned');
  //     }
  
  //     const { identityToken, nonce } = appleAuthRequestResponse;
  
  //     // 3️⃣ Create a Firebase credential using OAuthProvider
  //     const appleCredential = OAuthProvider.credential({
  //       idToken: identityToken,
  //       rawNonce: nonce,
  //     });
  
  //     // 4️⃣ Sign in the user with Firebase
  //     const userCredential = await signInWithCredential(auth, appleCredential);
  //     console.log('Apple user logged in:', userCredential.user);
  
  //     setIsLoading(false);
  //     setLoadingFor('');

  //     console.log({userCredential})
  
  //     // 5️⃣ Call your function to handle backend / Redux login
  //     // MakeAppleLoginUser(userCredential.user);
  
  //   } catch (err) {
  //     setIsLoading(false);
  //     setLoadingFor('');
  //     // console.error('Apple Login Error:', err);

  //       // ✅ Handle cancellation specifically
  //   if (
  //     err?.code === appleAuth.Error.CANCELED ||
  //     err?.message?.includes('error 1000') ||
  //     err?.message?.includes('AuthorizationError')
  //   ) {
  //     console.log('Apple Sign-In cancelled by user');
  //     return;
  //   }

  //   // ❌ Any other genuine errors
  //   console.error('Apple Login Error:', err);
  //   Toast.error('Login', 'Apple login failed. Please try again.');

  //   }
  // }

  async function onAppleButtonPress() {
    try {
      setIsLoading(true);
      setLoadingFor('apple');
  
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      
      console.log('🍎 Apple Response:', JSON.stringify(appleAuthRequestResponse, null, 2));
  
      if (!appleAuthRequestResponse.identityToken) {
        setIsLoading(false);
        setLoadingFor('');
        console.log('User cancelled or no token returned');
        return null; // 🚫 Return null instead of throwing error
      }
     console.log({appleAuthRequestResponse})
      const { identityToken, nonce } = appleAuthRequestResponse;
      // const appleCredential = OAuthProvider.credential({
      //   idToken: identityToken,
      //   rawNonce: nonce,
      // });
     
      // const userCredential = await signInWithCredential(auth, appleCredential);
      // console.log({userCredential})
      // setIsLoading(false);
      // setLoadingFor('');
      // return userCredential; // ✅ Return this so .then(res) gets a valid value
      

       // Create a Firebase credential from the response
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
        console.log({appleCredential})
      // Sign the user in with the credential
      return await signInWithCredential(auth, appleCredential);
    } catch (err) {
      setIsLoading(false);
      setLoadingFor('');
  
      if (
        err?.code === appleAuth.Error.CANCELED ||
        err?.message?.includes('error 1000') ||
        err?.message?.includes('AuthorizationError')
      ) {
        console.log('Apple Sign-In cancelled by user');
        return null; // ✅ Return null so no API call happens
      }
  
      console.error('Apple Login Error:', err);
      Toast.error('Login', 'Apple login failed. Please try again.');
      return null;
    }
  }

  async function onGoogleButtonPress() {
    setIsLoading(true);
    setLoadingFor('google');
  
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  
      const { idToken } = (await GoogleSignin.signIn()).data;
  
      if (!idToken) {
        throw new Error('Google ID Token not found');
      }
  
      const googleCredential = GoogleAuthProvider.credential(idToken);
  
      // return userCredential so .then() gets it
      return await signInWithCredential(auth, googleCredential);
  
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error; // goes to .catch()
    } finally {
      setIsLoading(false);
      setLoadingFor('');
    }
  }
  
  async function onFacebookButtonPress() {
    try {
      setIsLoading(true);
      setLoadingFor('fb');
  
      // Step 1: Attempt login with permissions
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
  
      if (result.isCancelled) {
        setIsLoading(false);
        setLoadingFor('');
        throw new Error('User cancelled the login process');
      }
  
      // Step 2: Get the user's access token
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        setIsLoading(false);
        setLoadingFor('');
        throw new Error('Something went wrong obtaining access token');
      }
  
      // Step 3: Create a Firebase credential with the token
      const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
  
      // Step 4: Sign-in the user with the credential
      const userCredential = await signInWithCredential(auth, facebookCredential);
  
      setIsLoading(false);
      setLoadingFor('');
  
      return userCredential; // returns user info like uid, displayName, email
    } catch (error) {
      setIsLoading(false);
      setLoadingFor('');
      console.log('Facebook login error:', error);
      throw error;
    }
  }

  const MakeAppleLoginUser = async res => {
    let data = {
      name: res?.user?.displayName == null ? '' : res?.user?.displayName,
      email: res?.additionalUserInfo?.profile?.email,
      type: 'apple',
      device_token: fcmToken || 'token_denied',
      access_token: res?.user?.uid,
      device_type: Platform.OS == 'android' ? '1' : '2',
    };

    SocialLoginRequest(data)
      .then(res => {
        Toast.success('Login', res?.message);
        let user = res?.result || {};

        const updatedUser = Object.assign({}, user, {
          type: 'apple',
        });

        Storage.store('userdata', updatedUser).then(() => {
          dispatch(userDataAction(updatedUser));
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'HomeScreen'}],
            }),
          );

          setIsLoading(false);
          setLoadingFor('');
        });
      })
      .catch(err => {
        Toast.error('Login', err?.message);
        setIsLoading(false);
        setLoadingFor('');
      });
  };

  const MakeFbUserLogin = async ({additionalUserInfo}) => {
    let data = {
      name: additionalUserInfo?.profile?.name,
      email: additionalUserInfo?.profile?.email,
      type: 'facebook',
      device_token: fcmToken || 'token_denied',
      access_token: additionalUserInfo?.profile?.id,
      device_type: Platform.OS == 'android' ? '1' : '2',
    };

    SocialLoginRequest(data)
      .then(res => {
        Toast.success('Login', res?.message);
        let user = res?.result || {};

        const updatedUser = Object.assign({}, user, {
          type: 'facebook',
        });

        Storage.store('userdata', updatedUser).then(() => {
          dispatch(userDataAction(updatedUser));
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'HomeScreen'}],
            }),
          );
        });
      })
      .catch(err => {
        Toast.error('Login', err?.message);
      });
  };

const MakeUserLogin = async (isGoogle = true) => {
  try {
    console.log({ isGoogle });

    const currentUser = await GoogleSignin.getCurrentUser();

    if (!currentUser || !currentUser.user) {
      throw new Error('Google user not found');
    }

    const user = currentUser.user;

    console.log({ user });

    const data = {
      name: user?.givenName + ' ' + user?.familyName,
      email: user?.email,
      type: isGoogle ? 'google' : 'facebook',
      device_token: fcmToken || 'token_denied',
      access_token: user?.id,
      device_type: Platform.OS === 'android' ? '1' : '2',
    };

    console.log(data, '-----', user);

    const res = await SocialLoginRequest(data);
    const userResult = res?.result || {};

    const updatedUser = { ...userResult, type: isGoogle ? 'google' : 'facebook' };
    Toast.success('Login', res?.message);

    await Storage.store('userdata', updatedUser);
    dispatch(userDataAction(updatedUser));
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'HomeScreen' }],
      }),
    );

  } catch (err) {
    console.error('MakeUserLogin Error:', err);
    Toast.error('Login', err?.message || 'Something went wrong');
  }
};


useEffect(() => {
    crashlytics().setCrashlyticsCollectionEnabled(true);
    getFCMToken()
      .then(res => {
        console.log('token', res);
        setFcmToken(res);
      })
      .catch(err => {
        console.debug('Error', err);
      });

    const backAction = () => {
      Alert.alert(
        'Exit From Alex',
        'Are you sure you want to close this application?',
        [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {text: 'YES', onPress: () => BackHandler.exitApp()},
        ],
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    Settings.setAppID('742487000924268');
    Settings.initializeSDK();
  }, [userInfo]);

  return (
    <>
      <CustomContainer>
      <ImageBackground source={ImageConstants.loginbg} style={{flex: 1}}>
      
        <View style={styles.container}>
          <Text style={styles.titleStyle}>Create or Login Account</Text>

          <View>
            {buttonList?.map((item, index) => {
              if (Platform.OS == 'android') {
                if (item?.type != 'apple') {
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={item.action}
                      style={{...styles.buttonStyle, position: 'relative'}}
                      key={index}>
                      {isLoading && item?.type == loadingFor && (
                        <View
                          style={{
                            width: '100%',
                            paddingVertical: 10,
                            position: 'absolute',
                            alignItems: 'center',
                            top: 0,
                            backgroundColor: '#fff',
                            opacity: 0.8,
                            zIndex: 9999,
                          }}>
                          <ActivityIndicator
                            size={'small'}
                            color={colors.primaryColor}
                          />
                        </View>
                      )}
                      <View style={styles.buttonSubView}>
                        <Image
                          source={item.icon}
                          style={styles.buttonIconStyle}
                        />
                        <Text style={styles.buttonTitle}>{item?.title}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }
              } else {
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={item.action}
                    style={styles.buttonStyle}
                    key={index}>
                    {isLoading && item?.type == loadingFor && (
                      <View
                        style={{
                          width: '100%',
                          paddingVertical: 10,
                          position: 'absolute',
                          alignItems: 'center',
                          top: 5,
                          backgroundColor: '#fff',
                          opacity: 0.8,
                          zIndex: 9999,
                        }}>
                        <ActivityIndicator
                          size={'small'}
                          color={colors.primaryColor}
                        />
                      </View>
                    )}
                    <View style={styles.buttonSubView}>
                      <Image
                        source={item.icon}
                        style={styles.buttonIconStyle}
                      />
                      <Text style={styles.buttonTitle}>{item?.title}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        </View>
      </ImageBackground>
      </CustomContainer>

      {/* <NoInternetModal shouldShow={!isInternetConnected} /> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: HEIGHT / 14,
    marginHorizontal: wp(24),
  },

  titleStyle: {
    fontFamily: fonts.medium,
    fontSize: wp(17),
    color: colors.black,
    marginBottom: wp(20),
  },

  buttonStyle: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGrayColor,
    padding: wp(12),
    borderRadius: 10,
    marginVertical: 5,
  },

  buttonSubView: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonIconStyle: {
    position: 'absolute',
    marginLeft: wp(12),
    height: 28,
    width: 28,
    flex: 1,
  },

  buttonTitle: {
    fontFamily: fonts.medium,
    fontSize: wp(16),
    color: colors.black,
    marginLeft: wp(52),
  },
});

export default SocialLoginScreen;
