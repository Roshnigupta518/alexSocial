import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  BackHandler,
  Image, TouchableOpacity, DeviceEventEmitter,
  Text, Platform, PermissionsAndroid, AppState, ScrollView, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, HEIGHT, wp } from '../../../constants';
import ReelHeader from '../../../components/ReelComponent/ReelHeader';
import ReelCard from '../../../components/ReelComponent/ReelCard';
import { useIsFocused } from '@react-navigation/native';
import CommentListSheet from '../../../components/ActionSheetComponent/CommentListSheet';
import { GetAllPostsRequest, GetAllStoryRequest, likeStoryRequest, makeStorySeenRequest } from '../../../services/Utills';
import Toast from '../../../constants/Toast';
import { useDispatch, useSelector } from 'react-redux';
import ShareSheet from '../../../components/ActionSheetComponent/ShareSheet';
import ReportActionSheet from '../../../components/ActionSheetComponent/ReportActionSheet';
import ReportTypeOptionSheet from '../../../components/ActionSheetComponent/ReportTypeOptionSheet';
import FollowUserSheet from '../../../components/ActionSheetComponent/FollowUserSheet';
import DeleteCommentSheet from '../../../components/ActionSheetComponent/DeleteCommentSheet';
import { ReelIndexAction } from '../../../redux/Slices/ReelIndexSlice';
import NoInternetModal from '../../../components/NoInternetModal';
import NetInfo from '@react-native-community/netinfo';
import { setCityAction } from '../../../redux/Slices/SelectedCitySlice';
import useLocation from '../../../hooks/useLocation';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import InstagramStories from '@birdwingo/react-native-instagram-stories';
import ImageConstants from '../../../constants/ImageConstants';
import { handleShareStoryFunction } from '../../../validation/helper';
import { ChangeMuteAction } from '../../../redux/Slices/VideoMuteSlice';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReadMore from '@fawazahmed/react-native-read-more';

const staticValues = {
  skip: 0,
  limit: 5,
  totalRecords: 0,
  currentTotalItems: 0,
  isLoading: false,
};
const HomeScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const nearByType = useSelector(state => state.NearBySlice?.data);
  const selectedCityData = useSelector(state => state.SelectedCitySlice?.data);
  const reelIndex = useSelector(state => state.ReelIndexSlice?.data);
  const userInfo = useSelector(state => state.UserInfoSlice.data);

  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;

  const screenHeight = Platform.OS === 'ios'
    ? HEIGHT - tabBarHeight - statusBarHeight
    : HEIGHT - tabBarHeight - statusBarHeight;

  const storyref = useRef(null)
  const prevNearBy = useRef(nearByType);
  const prevLocationTypeRef = useRef(selectedCityData?.locationType);

  const flashListRef = useRef();
  const deleteCommentRef = useRef();
  const isFocused = useIsFocused();
  const actionsheetRef = useRef();
  const followingUserRef = useRef();
  const shareSheetRef = useRef();
  const prevNearByTypeRef = useRef(nearByType);
  const menuSheetRef = useRef();
  const reportOptionSheet = useRef();
  const [isOnFocusItem, setIsOnFocusItem] = useState(true);

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [postArray, setPostArray] = useState([]);
  const [paramsValues, setParamsValues] = useState({
    location_title: 'Global',
    location_type: 'global',
    location_coordinates: null,
    location_distance: null,
    city: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    skip: staticValues.skip,
    limit: staticValues.limit,
    totalRecords: staticValues.totalRecords,
    currentTotalItems: staticValues.currentTotalItems,
    isLoading: staticValues.isLoading,
  });
  const [refreshing, setRefreshing] = React.useState(false);
  const [isInternetConnected, setIsInternetConnected] = useState(true);
  const [hasTriedFetchingPosts, setHasTriedFetchingPosts] = useState(false);
  const [stories, setStories] = useState([])
  const [skip, setSkip] = useState(0);
  const [limit] = useState(5); // fix limit as per API
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentStory, setCurrentStory] = useState({ userId: null, originalId: null, storyId: null, name: null, caption: null, added_from: null });
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  const { openStoryId } = route.params || {};

  const { location, city, error, permissionGranted, refreshLocation } = useLocation();
  // console.log({ location, city, error, permissionGranted, refreshLocation })

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

  // inside HomeScreen component:
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('storyDeleted', ({ storyId, userId, addedFrom }) => {
      if(addedFrom === '2'){
      handleDeleteStoryFromHome(storyId, userId, addedFrom);
    }else{
      handleDeleteStoryFromMy(storyId, userId, addedFrom);
    }
    });
    return () => sub.remove();
  }, [stories]);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('STORY_UPLOADED', (newStory) => {
     console.log({newStory})
      getStoryHandle()
    });
  
    return () => listener.remove();
  }, []);
  
  const onRefresh = React.useCallback(async () => {
    setIsLoading(true)
    console.log('call this refresh***************')

    setSkip(0); // Reset skip to 0 to fetch from the start
    setHasMore(true); // Reset hasMore to true
    setStories([]); // Clear existing stories

    console.log({ selectedCityData, paramsValues, currentCity: city })

    pagination.skip = staticValues.skip;
    pagination.limit = staticValues.limit;
    pagination.totalRecords = staticValues.totalRecords;
    pagination.currentTotalItems = staticValues.currentTotalItems;
    pagination.isLoading = staticValues.isLoading;

    setPostArray([]);
    await refreshLocation();
    getAllPosts();
    getStoryHandle(); // Fetch stories
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [paramsValues, selectedCityData, city, refreshLocation]);

  const getAllPosts = () => {
    // console.log({ selectedCityData, paramsValues, currentCity: city });

    if (selectedCityData?.locationType == 'current') {
      if (city == null && error == null) {
        // Still resolving location – do nothing
        setIsLoading(false);
        return;
      }
      if (!!error) {
        // Got location error
        setIsLoading(false);
        setHasTriedFetchingPosts(true);
        return;
      }
    }

    pagination.isLoading = true;

    // Only set isLoading when postArray is empty (for UX reasons)
    if (postArray?.length === 0) {
      setIsLoading(true);
    }

    let url = { skip: pagination.skip, limit: pagination.limit };

    if (selectedCityData?.locationType == 'current') {
      Object.assign(url, { city: city });
    } else if (paramsValues?.location_type == 'city') {
      Object.assign(url, { city: paramsValues?.city });
    } else if (paramsValues?.location_type == 'nearme') {
      Object.assign(url, {
        latitude: paramsValues?.location_coordinates?.latitude,
        longitude: paramsValues?.location_coordinates?.longitude,
        distance: paramsValues?.location_distance,
      });
    }

    GetAllPostsRequest(url)
      .then(res => {
        // setPostArray(prevPosts => [...prevPosts, ...res?.result]);
        setPostArray(prevPosts => {
          const merged = [...prevPosts, ...res?.result];
          const uniquePosts = Array.from(
            new Map(merged.map(item => [item?.postData?._id, item])).values()
          );
          return uniquePosts;
        });


        // Prefetch images
        res?.result?.forEach(item => {
          if (item?.postData?.post?.mimetype == 'image/jpeg') {
            Image.prefetch(item?.postData?.post?.data);
          }
        });

        pagination.totalRecords = res?.totalrecord;
        setHasTriedFetchingPosts(true);
      })
      .catch(err => {
        if (err?.message) {
          Toast.error('Posts', err.message);
        }
        setHasTriedFetchingPosts(true);
      })
      .finally(() => {
        pagination.isLoading = false;
        setIsLoading(false);
        setRefreshing(false);
      });
  };

  const transformApiToDummy = (apiData) => {
    return apiData.map(user => ({
      id: user.added_from === "2"
        ? user.business_id : user.user_id,
      name: user.user_name,
      user_id: user.user_id, // 👈 asli user_id bhi rakho
      added_from: user.added_from, // 👈 ye bhi rakho
      avatarSource: user.user_image ? { uri: user.user_image } : ImageConstants.business_logo,
      stories: user.stories.map(story => ({
        id: story.id,
        mediaType: story.media_type === 'video/mp4' ? 'video' : 'image',
        duration: story.duration,
        source: { uri: story.media },
        is_seen: story.is_seen,
        is_liked: story.is_liked,
        caption: story.caption,
        tagBusiness: story.tagBussiness || [],
      }))
    }));
  };

  const getStoryHandle = () => {
    if (loading) return;
    setLoading(true);
  
    GetAllStoryRequest()
      .then(res => {
        const dummyFormat = transformApiToDummy(res.result || []);
        console.log('Fetched stories:', dummyFormat.length);
  
        // ✅ Check if my story exists in API response
        const myStoryFromApi = dummyFormat.find(s => s.id === userInfo.id);
  
        const yourStoryObj = {
          id: userInfo.id,
          user_id: userInfo.id,
          name: 'You',
          avatarSource: userInfo.profile_picture
            ? { uri: userInfo.profile_picture }
            : ImageConstants.business_logo,
          stories: myStoryFromApi ? myStoryFromApi.stories : [],
          isAddButton: true,
          added_from: '1',
        };
  
        // ✅ Remove duplicate "my story" from API list
        const others = dummyFormat.filter(s => s.id !== userInfo.id);
  
        // ✅ Final list: always "You" story at first position
        const finalStories = [yourStoryObj, ...others];
  
        setStories(finalStories);
      })
      .catch(err => {
        if (err?.message) {
          Toast.error('stories', err.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  

  useFocusEffect(
    useCallback(() => {
      if (storyref.current) {
        storyref.current.hide();
      }
    }, [])
  );

  const handleStorySeen = (userId, storyId) => {
    setStories((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
            ...user,
            stories: user.stories.map((s) =>
              s.id === storyId ? { ...s, is_seen: true } : s
            ),
          }
          : user
      )
    );
  };


  const handleDeleteStoryFromMy = (storyId, userId, addedFrom) => {
    console.log({addedFrom})
    setStories(prev =>
      prev.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            stories: user.stories.filter(s => s.id !== storyId), // ✅ only story removed
          };
        }
        return user;
      })
    );
  };
  
  const handleDeleteStoryFromHome = (storyId, userId, addedFrom) => {
    setStories(prev =>
      prev
        .map(user => {
  
          // ✅ Case 2: Business story (added_from = "2")
          if (addedFrom === "2" && user.id === userId) {
            const updatedStories = user.stories.filter(s => s.id !== storyId);
            return updatedStories.length > 0 ? { ...user, stories: updatedStories } : null;
          }
  
          return user;
        })
        .filter(Boolean) // remove empty cards
    );
  };
  

  useEffect(() => {
    if (isFocused && route?.params?.shouldScrollTopReel) {
      // reset first
      setSkip(0);
      setHasMore(true);
      setStories([]);
      setLoading(false); // make sure not loading before fetch
    }
  }, [isFocused, route?.params?.shouldScrollTopReel]);

  useEffect(() => {
    // jab hasMore true ho jaye & isFocused ho, tab fetch karo
    if (isFocused && hasMore && skip === 0) {
      setLoading(true);
      getStoryHandle();
    }
  }, [isFocused, hasMore, skip]);

  useEffect(() => {
    if (openStoryId && stories.length > 0) {
      const index = stories.findIndex(s => s.id === openStoryId);
      if (index !== -1) {
        // Agar InstagramStories me openStory method hai to
        storyref.current?.scrollToStory(index);
      }
    }
  }, [openStoryId, stories]);


  const markStoryAsSeen = async (userId, storyId) => {
    try {
      if (storyId) {
        const res = await makeStorySeenRequest(storyId);
        // console.log('story seen ho gyi', storyId, res);
        handleStorySeen(userId, storyId)
      }
    } catch (err) {
      if (err?.message) {
        Toast.error('view stories', err.message);
      }
    }
  };

  const likeStoryHandle = async (storyId, newIsLiked) => {
    try {
      const res = await likeStoryRequest(storyId);
      Toast.success("Story", res?.message, "bottom");

      setStories(prevStories =>
        prevStories.map(user => ({
          ...user,
          stories: user.stories.map(st =>
            st.id === storyId ? { ...st, is_liked: newIsLiked } : st
          ),
        }))
      );
    } catch (err) {
      console.log({ err });
      if (err?.message) {
        Toast.error("Like stories", err.message, "bottom");
      }
    }
  };


  const _onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems[0]) {
      const index = viewableItems[0]?.index;
      setCurrentItemIndex(index);
      dispatch(ReelIndexAction(index));
      console.log({ currentItemIndex })
      // Load more if needed
      if (pagination.skip < pagination.totalRecords &&
        postArray?.length - 2 <= index &&
        !pagination.isLoading) {
        pagination.skip += pagination.limit;
        getAllPosts();
      }
    }
  }, [postArray.length, pagination]);

  const _viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  useEffect(() => {
    // setIsLoading(true)
    paramsValues.location_title = nearByType?.location_title;
    paramsValues.location_type = nearByType?.location_type;
    paramsValues.location_coordinates = nearByType?.location_coordinates;
    paramsValues.location_distance = nearByType?.location_distance;
    paramsValues.city = nearByType?.city;
  }, [nearByType]);

  useEffect(() => {
    if (!isFocused) {
      setIsOnFocusItem(false);
      return;
    }

    if ((error || !city) && selectedCityData?.locationType === 'current') {
      setIsLoading(false);
      setHasTriedFetchingPosts(true)
      console.log('got an error ')
      return;
    }

    const nearByChanged = JSON.stringify(prevNearByTypeRef.current) !== JSON.stringify(nearByType);
    const locationTypeChanged = prevLocationTypeRef.current !== selectedCityData?.locationType;

    // console.log({ nearByChanged, locationTypeChanged, locationType: selectedCityData?.locationType });

    if (route?.params?.shouldScrollTopReel || nearByChanged || locationTypeChanged) {
      setPostArray([]);
      onRefresh();
      getStoryHandle()
      prevNearByTypeRef.current = nearByType;
      prevLocationTypeRef.current = selectedCityData?.locationType;

      if (route?.params?.shouldScrollTopReel) {
        navigation.setParams({ shouldScrollTopReel: false });
      }
    } else if (postArray?.length === 0) {
      getAllPosts();
    } else {
      setTimeout(() => {
        flashListRef?.current?.scrollToIndex({
          index: currentItemIndex,
          animated: false,
        });
      }, 100);
    }

    setIsOnFocusItem(true);
  }, [isFocused, city, selectedCityData, error]);

  useFocusEffect(
    useCallback(() => {
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
            { text: 'YES', onPress: () => BackHandler.exitApp() },
          ],
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [navigation])
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => { });

    return () => {
      unsubscribe();
      flashListRef.current?.removeAllListeners?.();
    };
  }, []);

  useEffect(() => {
    if (reelIndex === 0 && postArray?.length > 0) {
      const timer = setTimeout(() => {
        if (flashListRef?.current) {
          flashListRef.current.scrollToOffset({ animated: true, offset: 0 });
        }
      }, 100); // wait for the list to mount
      return () => clearTimeout(timer);
    }
  }, [reelIndex]);

  const _renderReels = useCallback(
    ({ item, index }) => {
      return (
        <View style={[styles.cardContainer, { height: screenHeight }]} >
          <ReelCard
            idx={index}
            screen={'Home'}
            data={item}
            onCommentClick={idx => {
              actionsheetRef.current?.show(
                postArray[idx]?.postData?.user_id?._id,
              );
            }}
            onFollowingUserClick={() => followingUserRef.current?.show()}
            onMenuClick={() => menuSheetRef.current?.show()}
            onShareClick={() => shareSheetRef.current?.show()}
            isItemOnFocus={currentItemIndex == index && isOnFocusItem}
            screenHeight={screenHeight}
            isStoryOpen={isStoryOpen}
          />
        </View>
      );
    },
    [postArray, currentItemIndex, isOnFocusItem],
  );
  const getItemLayout = (data, index) => ({
    length: screenHeight,
    offset: screenHeight * index,
    index,
  });

  const shouldShowLoader =
    !hasTriedFetchingPosts || isLoading || (selectedCityData?.locationType === 'current' && city == null && error == null);

  const shouldShowEmptyMessage =
    hasTriedFetchingPosts && !isLoading && postArray.length === 0 && (city !== null || error !== null);

  const shouldShowLocationError =
    selectedCityData?.locationType === 'current' && !!error && postArray.length === 0;

  const handleLocationServices = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings')
    } else {
      Linking.openSettings()
    }
  }

  return (
    <>
      <View style={styles.container}>
        <ReelHeader
          onSearchClick={() => navigation.navigate('SearchScreen')}
          onNearByClick={() => navigation.navigate('NearByScreen')}
          notificationClick={() => navigation.navigate('NotificationScreen')}
          onTempaClick={() => {
            dispatch(setCityAction({ locationType: 'current' }))
            setPostArray([])
          }}
          selectedCity={selectedCityData?.locationType}
          currentCity={city}
        />

        <View style={styles.storyContainer}>
          {stories.length > 0 &&
            <SafeAreaView >
              <InstagramStories
                ref={storyref}
                key={stories.length} 
                stories={stories}
                onStoryPress={(story) => {
                  storyref.current?.open(story.id);
                  return null;
                }}
                onAddPress={() => navigation.navigate('AddStory', { added_from: 1 })}
                onTagPress={(businessObj) => {
                  console.log("Clicked business", businessObj);
                  storyref?.current?.hide();
                  navigation.navigate("ClaimBusinessScreen", {
                    ...businessObj,
                  });
                }}
                animationDuration={5000}
                avatarSize={60}
                storyContainerStyle={{ margin: 0, padding: 0 }}
                progressContainerStyle={{ margin: 0, padding: 0 }}
                containerStyle={{ marginTop: Platform.OS === 'android' && '-8%', zIndex: 3, }}
                closeIconColor='#fff'
                progressColor={colors.gray}
                progressActiveColor={colors.primaryColor}
                showName={true}
                nameTextStyle={{ color: colors.white, textAlign: 'center' }}
                textStyle={{ color: colors.white }}
                footerComponent={() => {
                  if (!currentStory || !currentStory.storyId) return null; 

                 // 👇 sirf apni sari stories
                 const myStoriesData = stories.find(
                  item => item.user_id === userInfo.id && item.added_from === "2"
                );
                
                const myStories = myStoriesData ? myStoriesData.stories : [];
                // console.log("My Stories", myStories);
                

                //  for(let i=0; stories.length>i; i++){
                //   console.log('hi',stories[i])
                //  }

                  // console.log({myStories})
                  const currentStoryData = stories
                    .find(u => u.id === currentStory?.userId)
                    ?.stories.find(s => s.id === currentStory?.storyId);
                  // console.log({currentStory})
                  return (
                    <View style={{ padding: 20 }}>


                      {currentStory?.caption &&
                        <View style={styles.captionContainer}>

                          <ReadMore
                            numberOfLines={2}
                            style={{
                              fontFamily: fonts.regular,
                              fontSize: wp(10),
                              color: colors.white,
                            }}
                            seeMoreStyle={{ color: colors.primaryColor }}
                            seeLessStyle={{ color: colors.primaryColor }}>
                            {currentStory?.caption}
                          </ReadMore>

                        </View>
                      }

                      <View style={{ flexDirection: 'row', }}>
                        {currentStory && (
                          (currentStory.added_from === "1" || currentStory.added_from === "2") &&
                          currentStory?.originalId == userInfo.id && (   
                            <TouchableOpacity
                              onPress={() => {
                                storyref?.current?.hide();
                                navigation.navigate("StoryViewers", {
                                  storyId: currentStory?.storyId,
                                  stories: myStories,
                                });
                              }}
                            >
                              <Image source={ImageConstants.openEye} />
                            </TouchableOpacity>
                          )
                        )}


                        <View style={{
                          width: '90%',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                        }}>
                          {userInfo?.id !== currentStory?.userId &&
                            <View>
                              {currentStoryData?.is_liked ?
                                <TouchableOpacity
                                  style={{ marginRight: 20 }}
                                  onPress={() => likeStoryHandle(currentStory?.storyId, false)} >
                                  <Image
                                    source={ImageConstants.filled_like}
                                    style={styles.likeSty}
                                  />
                                </TouchableOpacity>
                                :
                                <TouchableOpacity
                                  style={{ marginRight: 20 }}
                                  onPress={() => likeStoryHandle(currentStory?.storyId, true)} >
                                  <Image
                                    source={ImageConstants.unlike}
                                    style={styles.likeSty}
                                  />
                                </TouchableOpacity>
                              }
                            </View>}

                          <TouchableOpacity onPress={() => handleShareStoryFunction(currentStory?.storyId, storyref)}>
                            <Image source={ImageConstants.share} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )
                }}

                onStoryStart={(userId, storyId) => {
                  // console.log("📢 Story opened -> Pausing reels");
                  console.log("👉 story started");
                  setIsStoryOpen(true);
                  dispatch(ChangeMuteAction(true));

                  const parentUser = stories.find(user => user.id === userId);
                  const storyObj = parentUser?.stories.find(s => s.id === storyId);
                  // console.log({ parentUser })
                  // Check if the current user has stories
                  if (userInfo.id === userId && (!parentUser || parentUser.stories.length === 0)) {
                    storyref.current?.hide(userId);
                    navigation.navigate('AddStory', { added_from: 1 });
                    return; // Prevent further execution of this function
                  }

                  setCurrentStory({
                    userId,
                    originalId: parentUser?.user_id,
                    storyId,
                    name: parentUser?.name,
                    added_from: parentUser?.added_from, // 👈 added
                    avatarSource: parentUser?.avatarSource?.uri,
                    caption: storyObj?.caption
                  });
                  markStoryAsSeen(userId, storyId);
                }}

                onStoryEnd={(userId, storyId) => {
                  console.log("📢 Story closed -> Resuming reels");
                  setCurrentStory()

                   // ✅ check if it's the last story
  const userIndex = stories.findIndex(u => u.id === userId);
  const userStories = stories[userIndex]?.stories || [];
  const storyIndex = userStories.findIndex(s => s.id === storyId);

  const isLastStoryOfUser = storyIndex === userStories.length - 1;
  const isLastUser = userIndex === stories.length - 1;

  if (isLastStoryOfUser && isLastUser) {
    // last wali story thi
    storyref.current?.hide();
    setIsStoryOpen(false);
    dispatch(ChangeMuteAction(false));
  }
                }}

                onHide={(id) => {
                  // console.log("📢 Story hidden -> Resuming reels");
                  console.log("👉 story closed");
                  setIsStoryOpen(false);
                  dispatch(ChangeMuteAction(false));
                }}
                avatarBorderColors={['#0896E6', '#FFE35E', '#FEDF00', '#55A861', '#2291CF']}
                avatarSeenBorderColors={[colors.gray]}
                saveProgress={true}
              />
            </SafeAreaView>
          }
        </View>

        <View
          style={{
            height: screenHeight,
          }}>
          <FlatList
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            nestedScrollEnabled
            ref={flashListRef}
            data={postArray}
            renderItem={_renderReels}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={currentItemIndex}
            disableIntervalMomentum
            onViewableItemsChanged={_onViewableItemsChanged}
            viewabilityConfig={_viewabilityConfig}
            estimatedItemSize={2}
            pagingEnabled
            initialNumToRender={2}
            removeClippedSubviews={true}
            windowSize={5}
            maxToRenderPerBatch={5}
            getItemLayout={getItemLayout}
            contentInset={{ top: 0, bottom: 0, left: 0, right: 0 }}
            contentContainerStyle={{
              alignSelf: 'center',
            }}
            keyExtractor={(item, index) => `${item.postData?._id || item._id || item.id || 'idx'}_${index}`}
            extraData={{ screenHeight }}
            ListEmptyComponent={() => {
              if (shouldShowLoader) {
                return (
                  <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.white} />
                  </View>
                );
              }
              if (shouldShowLocationError) {
                return (
                  <View style={styles.center}>
                    <Text onPress={() => handleLocationServices()}
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: wp(16),
                        color: colors.white,
                        textAlign: 'center',
                        marginBottom: 10,
                      }}>
                      Failed to fetch location. Please enable location services.
                    </Text>
                    <Text onPress={onRefresh} style={{
                      fontFamily: fonts.bold,
                      fontSize: wp(16),
                      color: colors.white,
                      textAlign: 'center',
                      marginBottom: 10,
                    }}>
                      Retry
                    </Text>
                  </View>
                );
              }
              if (shouldShowEmptyMessage) {
                return (
                  <View style={styles.center}>
                    <Text
                      onPress={() => {
                        if (selectedCityData?.locationType === 'current') {
                          navigation.navigate('PostMediaScreen');
                        }
                      }}
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: wp(16),
                        color: colors.white,
                      }}>
                      {selectedCityData?.locationType === 'current'
                        ? 'Be the first one to post in this city'
                        : 'No post found!'}
                    </Text>
                  </View>
                );
              }
              return null;
            }}
          />
        </View>


        <CommentListSheet
          ref={actionsheetRef}
          postId={postArray[currentItemIndex]?.postData?._id}
          commentCount={postArray[currentItemIndex]?.comment}
          onCommentAdded={() => {
            let temp = postArray || [];
            Object.assign(temp[currentItemIndex], {
              comment: temp[currentItemIndex]?.comment + 1,
            });
            setPostArray([...temp]);
          }}
          onCommentDelete={id => {
            setTimeout(() => {
              deleteCommentRef.current?.show(id);
            }, 800);
          }}
        />

        <DeleteCommentSheet
          ref={deleteCommentRef}
          onDelete={() => {
            let temp = postArray || [];
            if (temp[currentItemIndex]?.comment > 0) {
              Object.assign(temp[currentItemIndex], {
                comment: temp[currentItemIndex]?.comment - 1,
              });
              setPostArray([...temp]);
            }
          }}
        />

        <ShareSheet ref={shareSheetRef} data={postArray[currentItemIndex]} />
        <ReportActionSheet
          ref={menuSheetRef}
          postId={postArray[currentItemIndex]?.postData?._id}
          userId={postArray[currentItemIndex]?.postData?.user_id?._id}
          loggedInUserId={userInfo?.id}
          onActionClick={(userId, postId, type) =>
            reportOptionSheet?.current?.show(userId, postId, type)
          }
        />
        <ReportTypeOptionSheet
          ref={reportOptionSheet}
          onActionDone={onRefresh}
        />

        <FollowUserSheet
          ref={followingUserRef}

          // User props
          userDetail={
            postArray[currentItemIndex]?.postData?.added_from === '1'
              ? postArray[currentItemIndex]?.postData?.user_id
              : null
          }
          isFollowing={postArray[currentItemIndex]?.isFollowed}
          onFollowed={() => {
            let temp = [...postArray];
            let userId = postArray[currentItemIndex]?.postData?.user_id?._id;
            temp?.forEach(item => {
              if (item?.postData?.user_id?._id === userId) {
                item.isFollowed = true;
              }
            });
            setPostArray(temp);
          }}
          onUnfollowed={() => {
            let temp = [...postArray];
            let userId = postArray[currentItemIndex]?.postData?.user_id?._id;
            temp?.forEach(item => {
              if (item?.postData?.user_id?._id === userId) {
                item.isFollowed = false;
              }
            });
            setPostArray(temp);
          }}

          // Business props
          businessDetail={
            postArray[currentItemIndex]?.postData?.added_from === '2' &&
              postArray[currentItemIndex]?.postData?.tagBussiness?.[0]
              ? postArray[currentItemIndex]?.postData?.tagBussiness?.[0]
              : null
          }
          isBusinessFollowing={
            postArray[currentItemIndex]?.postData?.tagBussiness?.[0]
              ?.isFollowedBusiness
          }
          onBusinessFollowed={() => {
            let temp = [...postArray];
            let businessId = postArray[currentItemIndex]?.postData?.tagBussiness?.[0]?._id;
            temp?.forEach(item => {
              if (
                item?.postData?.tagBussiness?.[0]?._id === businessId
              ) {
                item.postData.tagBussiness[0].isFollowedBusiness = true;
              }
            });
            setPostArray(temp);
          }}
          onBusinessUnfollowed={() => {
            let temp = [...postArray];
            let businessId = postArray[currentItemIndex]?.postData?.tagBussiness?.[0]?._id;
            temp?.forEach(item => {
              if (
                item?.postData?.tagBussiness?.[0]?._id === businessId
              ) {
                item.postData.tagBussiness[0].isFollowedBusiness = false;
              }
            });
            setPostArray(temp);
          }}
        />
      </View>
      <NoInternetModal shouldShow={!isInternetConnected} />
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.gray,
  },
  storyContainer: {
    zIndex: 3, 
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 40,
  },
  profilesty: {
    width: 69,
    height: 69,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileCap: {
    width: 25, height: 25, borderRadius: 50, marginRight: 10,
    borderColor: colors.primaryColor,
    borderWidth: 2
  },
  profileImg: { width: 60, height: 60, borderRadius: 50 },
  plusicon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primaryColor, // Instagram blue
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  iconsty: {
    width: wp(20),
    height: wp(20)
  },
  likeSty: {
    height: wp(24),
    width: wp(24),
    resizeMode: 'contain',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '100%'
  },
  captionContainer: {
    // flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center'
  },
  businessContainer: {
    backgroundColor: '#fff',
    padding: 10, opacity: 0.2,
    borderRadius: 5, alignItems: 'center',
    marginBottom: 10
  }
});

export default HomeScreen;

