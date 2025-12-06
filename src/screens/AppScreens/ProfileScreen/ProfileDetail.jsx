// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   SafeAreaView,
//   Image,
//   TouchableOpacity,
//   Platform,
//   StyleSheet,
//   FlatList, Dimensions, BackHandler, ActivityIndicator
// } from 'react-native';
// import { colors, fonts, HEIGHT, WIDTH, wp } from '../../../constants';
// import BackHeader from '../../../components/BackHeader';
// import ImageConstants from '../../../constants/ImageConstants';
// import { useSelector } from 'react-redux';
// import { useIsFocused } from '@react-navigation/native';
// import {
//   GetUserPostsRequest,
//   GetUserProfileRequest,
// } from '../../../services/Utills';
// import Toast from '../../../constants/Toast';
// import NoInternetModal from '../../../components/NoInternetModal';
// import NetInfo from '@react-native-community/netinfo';
// import TabsHeader from '../../../components/TabsHeader';
// import { formatCount, openSocialLink, tabList } from '../../../validation/helper';
// import MediaItem from '../../../components/GridView';
// import NotFoundAnime from '../../../components/NotFoundAnime';
// import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
// import { useFocusEffect } from '@react-navigation/native';
// import { SocialLinks } from '../../../components/social';
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import CustomContainer from '../../../components/container';

// const ProfileDetail = ({ navigation, route }) => {
//   const isFocused = useIsFocused();
//   const insets = useSafeAreaInsets();

//   const userInfo = useSelector(state => state.UserInfoSlice.data);
//   const [userDetails, setUserDetails] = useState(null);
//   const [postData, setPostData] = useState([]);
//   const [isInternetConnected, setIsInternetConnected] = useState(true);
 
//   const [activeTab, setActiveTab] = useState('video');
//   const [isLoading, setIsLoading] = useState(false)

//   const [skip, setSkip] = useState(0);
//   const [limit] = useState(5);
//   const [hasMore, setHasMore] = useState(true);
//   const [isFetchingMore, setIsFetchingMore] = useState(false);

//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener(state => {
//       if (state.isConnected !== null && state.isConnected === false) {
//         // Set internet connection status to false when not connected
//         setIsInternetConnected(false);
//         console.log('No internet connection');
//       } else if (
//         state.isConnected === true &&
//         state.isInternetReachable !== undefined
//       ) {
//         // Only update when connection is reachable
//         console.log(
//           'State of Internet reachability: ',
//           state.isInternetReachable,
//         );

//         // Set connection status based on reachability
//         setIsInternetConnected(state.isInternetReachable);
//       }
//     });

//     // Unsubscribe
//     return () => unsubscribe();
//   }, []);
//   const getUserProfile = () => {
//     // console.log('ser', userInfo);
//     GetUserProfileRequest(route?.params?.userId || userInfo?.id)
//       .then(res => {
//         setUserDetails(res?.result);
//       })
//       .catch(err => {
//         Toast.error('Profile', err?.message);
//       });
//   };

//   const getUsersPosts = async (isLoadMore = false) => {
//     if (isLoadMore && isFetchingMore) return;
  
//     if (!isLoadMore) setIsLoading(true);
//     else setIsFetchingMore(true);
  
//     const userId = route?.params?.userId || userInfo?.id;
  
//     try {
//       const res = await GetUserPostsRequest(userId, skip, limit);
//       if (res?.result?.length > 0) {
//         setPostData(prev => (isLoadMore ? [...prev, ...res.result] : res.result));
//         setSkip(prev => prev + limit);
//       } else {
//         setHasMore(false);
//       }
//     } catch (err) {
//       Toast.error('Post', err?.message);
//     } finally {
//       if (!isLoadMore) setIsLoading(false);
//       else setIsFetchingMore(false);
//     }
//   };

//   const renderTabContent = () => {
//     let filteredData = [];

//     if (activeTab === 'photo') {
//       filteredData = postData.filter(item => item?.postData?.post?.mimetype !== 'video/mp4');
//     } else if (activeTab === 'video') {
//       filteredData = postData.filter(item => item?.postData?.post?.mimetype === 'video/mp4');
//     }

//     if (filteredData.length === 0) {
//       return (
//         <NotFoundAnime isLoading={isLoading} />
//       );
//     }

//     return (
//       <FlatList
//         data={filteredData}
//         renderItem={({ item, index }) => (
//           <MediaItem
//             item={item}
//             onPress={() =>
//               navigation.navigate('ReelViewer', {
//                 data: filteredData,
//                 currentIndex: index,
//                 onDeletePost: deletedId => {
//                   setPostData(prev => prev.filter(item => item?.postData?._id !== deletedId));
//                 },
//               })
//             }
//             index={index}
//           />
//         )}
//         numColumns={3}
//         keyExtractor={(item, index) => index.toString()}
//         contentContainerStyle={{ padding: 15 }}
//         onEndReached={() => {
//           if (hasMore && !isFetchingMore) getUsersPosts(true);
//         }}
//         onEndReachedThreshold={0.5}
//         ListFooterComponent={
//           isFetchingMore ? (
//             <ActivityIndicator size="small" color={colors.primaryColor} />
//           ) : !hasMore ? (
//             null  //no more posts
//           ) : null
//         }
//       />
//     );
//   };


//   useEffect(() => {
//     if (isFocused) {
//       getUserProfile();
//     }
//   }, [isFocused]);
  
//   useEffect(() => {
//     setSkip(0);
//     setHasMore(true);
//     setPostData([]);
//     getUsersPosts();
//   }, [route?.params?.userId]);
  

//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         navigation.navigate('HomeScreen'); // your target screen
//         return true; // prevent default back action
//       };
  
//       // ✅ Store subscription
//       const backHandler = BackHandler.addEventListener(
//         'hardwareBackPress',
//         onBackPress,
//       );
  
//       // ✅ Clean up properly
//       return () => backHandler.remove();
//     }, [navigation]),
//   );

//   return (
//     <>
//      <CustomContainer>
//         <BackHeader label="Profile Details"
//           onPress={() => navigation.navigate('HomeScreen')}
//           rightView={() => <TouchableOpacity
//            onPress={() => navigation.navigate('Setting',{
//             onDeletePost: deletedId => {
//               setPostData(prev => prev.filter(item => item?.postData?._id !== deletedId));
//             },
//            })} >
//             <Image source={ImageConstants.settings} style={styles.imgsty}
//              />
//           </TouchableOpacity>}
//           profileEdit={true}
//           onEdit={() => navigation.navigate('EditProfileScreen')}
//         />
//         <View
//           style={{
//             flex: 1,
//           }}>
//           <View style={styles.UserImageView}>
//             <View style={styles.wdh30}>
//               <Image
//                 source={
//                   userDetails?.profile_picture
//                     ? { uri: userDetails?.profile_picture }
//                     : ImageConstants.user
//                 }
//                 style={styles.userImagesStyle}
//               />
//             </View>

//             <View style={styles.wdh70}>
//               <View style={styles.profileCounts}>
//                 <View style={styles.wdh33}>
//                   <View>
//                     <Text style={styles.contentTextStyle}>{formatCount(userDetails?.post_count)}</Text>
//                     <Text style={styles.contentTitleStyle}>Posts</Text>
//                   </View>

//                 </View>
//                 <View style={styles.wdh33}>
//                   <TouchableOpacity onPress={() =>
//                     navigation.navigate('FollowUsers', {
//                       id: userInfo?.id,
//                       type: 'followers',
//                     })
//                   }>
//                     <Text style={styles.contentTextStyle}>{formatCount(userDetails?.follower_count)}</Text>
//                     <Text style={styles.contentTitleStyle}>Followers</Text>
//                   </TouchableOpacity>

//                 </View>
//                 <View style={styles.wdh33}>
//                   <TouchableOpacity
//                     onPress={() =>
//                       navigation.navigate('FollowUsers', {
//                         id: userInfo?.id,
//                         type: 'following',
//                       })
//                     }>
//                     <Text style={styles.contentTextStyle}>{formatCount(userDetails?.following_count)}</Text>
//                     <Text style={styles.contentTitleStyle}>Following</Text>
//                   </TouchableOpacity>

//                 </View>
//               </View>

//               <View style={[styles.profileCounts, { marginVertical: 10 }]}>
//                 {/* <View style={styles.wdh33}>
//                   <View >
//                     <Text style={styles.contentTextStyle}>{formatCount(userDetails?.places_count)}</Text>
//                     <Text style={styles.contentTitleStyle}>Places</Text>
//                   </View>
//                 </View> */}
//                 <View style={styles.wdh33}>

//                   <TouchableOpacity onPress={() =>
//                     navigation.navigate('UserPlaces', {
//                       id: userInfo?.id,
//                       type: 'Cities',
//                       onPostDelete: (deletedId) => {
//                         setPostData(prev => prev.filter(item => item?.postData?._id !== deletedId));
//                       },
//                     })
//                   }>
//                     <Text style={styles.contentTextStyle}>{formatCount(userDetails?.cityes_count)}</Text>
//                     <Text style={styles.contentTitleStyle}>Cities</Text>
//                   </TouchableOpacity>
//                 </View>
//                 <View style={styles.wdh33}>

//                   <TouchableOpacity onPress={() =>
//                     navigation.navigate('UserPlaces', {
//                       id: userInfo?.id,
//                       type: 'Countries',
//                       onPostDelete: (deletedId) => {
//                         setPostData(prev => prev.filter(item => item?.postData?._id !== deletedId));
//                       },
//                     })
//                   }>
//                     <Text style={styles.contentTextStyle}>{formatCount(userDetails?.countries_count)}</Text>
//                     <Text style={styles.contentTitleStyle}>Countries</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               <View style={styles.ml20}>
//               <SocialLinks  data={userDetails}/>
//               </View>
//             </View>
//           </View>


//           <View style={{ paddingHorizontal: 20 }}>
//             <Text style={[styles.contentTextStyle, { textAlign: 'left' }]}>{userDetails?.name}</Text>
//             {(userDetails?.city || userDetails?.bio) &&
//               <Text style={[styles.contentTitleStyle, { textAlign: 'left' }]}>{userDetails?.city}{'\n'}
//                 {userDetails?.bio}
//               </Text>}
//           </View>

//           <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabList} />
//           {renderTabContent()}

//         </View>
//       </CustomContainer>
//       {/* <NoInternetModal shouldShow={!isInternetConnected} /> */}
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   getChildrenStyle: {
//     width: (WIDTH - 18) / 2,
//     height: Number(Math.random() * 20 + 12) * 10,
//     backgroundColor: 'green',
//     margin: 4,
//     borderRadius: 18,
//   },
//   ml20:{
//    marginLeft:40
//   }, 
//   iconsty:{
//     overflow: 'visible', 
//     marginHorizontal:wp(10)
//   },
//   masonryHeader: {
//     position: 'absolute',
//     zIndex: 10,
//     flexDirection: 'row',
//     padding: 5,
//     alignItems: 'center',
//     backgroundColor: 'rgba(150,150,150,0.4)',
//   },
//   userPic: {
//     height: 20,
//     width: 20,
//     borderRadius: 10,
//     marginRight: 10,
//   },
//   userName: {
//     fontSize: 15,
//     color: '#fafafa',
//     fontWeight: 'bold',
//   },

//   userPostImage: {
//     height: 140,
//     width: WIDTH / 2.1,
//     margin: 4,
//   },

//   videoPostStyle: {
//     height: 200,
//     width: WIDTH / 2.2,
//     borderRadius: 10,
//   },

//   container: {
//     flex: 1,
//     backgroundColor: colors.white,
//   },

//   headerView: {
//     position: 'absolute',
//     marginTop: Platform.OS == 'ios' ? wp(50) : wp(20),
//     zIndex: 2,
//   },

//   titleStyle: {
//     fontFamily: fonts.semiBold,
//     fontSize: wp(22),
//     color: colors.black,
//     textAlign: 'center',
//   },

//   UserImageView: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: wp(10),
//     marginHorizontal: wp(20),
//   },

//   userImagesStyle: {
//     height: wp(120),
//     width: wp(120),
//     borderRadius: 100,
//   },

//   userNameStyle: {
//     fontFamily: fonts.semiBold,
//     fontSize: wp(20),
//     color: colors.black,
//     width: WIDTH / 2.1,
//   },

//   editProfileStyle: {
//     backgroundColor: colors.primaryColor,
//     padding: wp(10),
//     borderRadius: 5,
//     alignItems: 'center',
//     marginTop: 10,
//   },

//   editProfileTxt: {
//     fontFamily: fonts.semiBold,
//     fontSize: wp(16),
//     color: colors.black,
//   },

//   numberContentContainer: {
//     backgroundColor: colors.white,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginHorizontal: 15,
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//     borderRadius: 10,
//     shadowColor: colors.black,
//     shadowOffset: { height: 1, width: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 20,
//     elevation: 2,
//   },

//   contentTextStyle: {
//     fontFamily: fonts.semiBold,
//     fontSize: wp(14),
//     color: colors.black,
//     textAlign: 'center'
//   },

//   contentTitleStyle: {
//     fontFamily: fonts.regular,
//     fontSize: wp(12),
//     color: colors.gray,
//     textAlign: 'center'
//   },

//   contentView: {
//     alignItems: 'center',
//   },

//   listViewStyle: {
//     flex: 1,
//     marginTop: 10,
//   },

//   videoContainer: {
//     padding: 4,
//     borderWidth: 1,
//     borderColor: colors.primaryColor,
//     borderRadius: 10,
//     margin: 4,
//   },
//   playIconStyle: {
//     position: 'absolute',
//     top: 75,
//     width: WIDTH / 2.1,
//     zIndex: 2,
//   },
//   imgsty: { width: wp(20), height: wp(20) },
//   profileCounts: {
//     flexDirection: 'row',
//     marginLeft: 15
//   },
//   wdh70: { width: '70%' },
//   wdh33: { width: "33%" },
//   wdh30: { width: "30%" }

// });

// export default ProfileDetail;

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { colors, fonts, WIDTH, wp } from '../../../constants';
import BackHeader from '../../../components/BackHeader';
import ImageConstants from '../../../constants/ImageConstants';
import { useSelector } from 'react-redux';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import {
  GetUserPostsRequest,
  GetUserProfileRequest,
} from '../../../services/Utills';
import Toast from '../../../constants/Toast';
import TabsHeader from '../../../components/TabsHeader';
import { formatCount, tabList } from '../../../validation/helper';
import MediaItem from '../../../components/GridView';
import NotFoundAnime from '../../../components/NotFoundAnime';
import { SocialLinks } from '../../../components/social';
import CustomContainer from '../../../components/container';

const ProfileDetail = ({ navigation }) => {
  const isFocused = useIsFocused();
  const userInfo = useSelector(state => state.UserInfoSlice.data);

  const [userDetails, setUserDetails] = useState(null);

  // Tab-wise states (best approach)
  const [videoPosts, setVideoPosts] = useState([]);
  const [photoPosts, setPhotoPosts] = useState([]);

  const [videoPage, setVideoPage] = useState(0);
  const [photoPage, setPhotoPage] = useState(0);

  const [videoHasMore, setVideoHasMore] = useState(true);
  const [photoHasMore, setPhotoHasMore] = useState(true);

  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [isVideoLoadingMore, setIsVideoLoadingMore] = useState(false);
  const [isPhotoLoadingMore, setIsPhotoLoadingMore] = useState(false);

  const [activeTab, setActiveTab] = useState('video');
  const limit = 15;

   useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('HomeScreen'); // your target screen
        return true; // prevent default back action
      };
  
      // ✅ Store subscription
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
  
      // ✅ Clean up properly
      return () => backHandler.remove();
    }, [navigation]),
  );

  // ------------------ GET PROFILE ------------------
  const getUserProfile = async () => {
    try {
      const res = await GetUserProfileRequest(userInfo?.id);
      setUserDetails(res?.result);
    } catch (err) {
      Toast.error('Profile', err?.message);
    }
  };

  // ------------------ GET POSTS (VIDEO / PHOTO) ------------------
  const getPosts = async (type, isLoadMore = false) => {
    const page = type === 'video' ? videoPage : photoPage;
    const hasMore = type === 'video' ? videoHasMore : photoHasMore;

    if (isLoadMore && !hasMore) return;

    if (type === 'video') {
      isLoadMore ? setIsVideoLoadingMore(true) : setIsVideoLoading(true);
    } else {
      isLoadMore ? setIsPhotoLoadingMore(true) : setIsPhotoLoading(true);
    }

    try {
      const skip = isLoadMore ? page * limit : 0;
      const fileType = type === 'video' ? 2 : 1;

      const res = await GetUserPostsRequest(userInfo?.id, skip, limit, fileType);
      const newData = res?.result ?? [];

      if (type === 'video') {
        setVideoPosts(prev => (isLoadMore ? [...prev, ...newData] : newData));
        setVideoPage(prev => prev + 1);
        if (newData.length < limit) setVideoHasMore(false);
      } else {
        setPhotoPosts(prev => (isLoadMore ? [...prev, ...newData] : newData));
        setPhotoPage(prev => prev + 1);
        if (newData.length < limit) setPhotoHasMore(false);
      }
    } catch (err) {
      Toast.error('Posts', err?.message);
    } finally {
      if (type === 'video') {
        setIsVideoLoading(false);
        setIsVideoLoadingMore(false);
      } else {
        setIsPhotoLoading(false);
        setIsPhotoLoadingMore(false);
      }
    }
  };

  // ------------------ INITIAL LOAD ------------------
  useEffect(() => {
    if (isFocused) {
      getUserProfile();
      
      // Reset everything
      setVideoPosts([]);
      setPhotoPosts([]);
      setVideoPage(0);
      setPhotoPage(0);
      setVideoHasMore(true);
      setPhotoHasMore(true);
      setActiveTab('video');

      // Load only videos first
      getPosts('video');
    }
  }, [isFocused]);

  // ------------------ TAB CHANGE ------------------
  useEffect(() => {
    if (activeTab === 'video' && videoPosts.length === 0) {
      getPosts('video');
    } else if (activeTab === 'photo' && photoPosts.length === 0) {
      getPosts('photo');
    }
  }, [activeTab]);

  // ------------------ CURRENT DATA & LOADER ------------------
  const currentPosts = activeTab === 'video' ? videoPosts : photoPosts;
  const isLoading = activeTab === 'video' ? isVideoLoading : isPhotoLoading;
  const isLoadingMore = activeTab === 'video' ? isVideoLoadingMore : isPhotoLoadingMore;
  const hasMore = activeTab === 'video' ? videoHasMore : photoHasMore;

  // ------------------ RENDER HEADER ------------------
    const renderHeader = () => (
      <View>
     
        <View style={styles.UserImageView}>
          <View style={styles.wdh30}>
            <Image
              source={
                userDetails?.profile_picture
                  ? { uri: userDetails.profile_picture }
                  : ImageConstants.user
              }
              style={styles.userImagesStyle}
            />
          </View>
  
          <View style={styles.wdh70}>
            <View style={styles.profileCounts}>
              <View style={styles.wdh33}>
                <Text style={styles.contentTextStyle}>
                  {formatCount(userDetails?.post_count )}
                </Text>
                <Text style={styles.contentTitleStyle}>Posts</Text>
              </View>
              <View style={styles.wdh33}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FollowUsers', { id: userInfo?.id, type: 'followers' })}
                >
                  <Text style={styles.contentTextStyle}>
                    {formatCount(userDetails?.follower_count )}
                  </Text>
                  <Text style={styles.contentTitleStyle}>Followers</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.wdh33}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FollowUsers', { id: userInfo?.id, type: 'following' })}
                >
                  <Text style={styles.contentTextStyle}>
                    {formatCount(userDetails?.following_count )}
                  </Text>
                  <Text style={styles.contentTitleStyle}>Following</Text>
                </TouchableOpacity>
              </View>
            </View>
  
            <View style={[styles.profileCounts, { marginVertical: 10 }]}>
              <View style={styles.wdh33}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('UserPlaces', { id: userInfo?.id, type: 'Cities' })}
                >
                  <Text style={styles.contentTextStyle}>
                    {formatCount(userDetails?.cityes_count )}
                  </Text>
                  <Text style={styles.contentTitleStyle}>Cities</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.wdh33}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('UserPlaces', { id: userInfo?.id, type: 'Countries' })}
                >
                  <Text style={styles.contentTextStyle}>
                    {formatCount(userDetails?.countries_count )}
                  </Text>
                  <Text style={styles.contentTitleStyle}>Countries</Text>
                </TouchableOpacity>
              </View>
            </View>
  
            <View style={styles.ml20}>
              <SocialLinks data={userDetails} />
            </View>
          </View>
        </View>
  
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.contentTextStyle, { textAlign: 'left' }]}>
            {userDetails?.name || 'Loading...'}
          </Text>
          {(userDetails?.city || userDetails?.bio) && (
            <Text style={[styles.contentTitleStyle, { textAlign: 'left' }]}>
              {userDetails?.city}
              {'\n'}
              {userDetails?.bio}
            </Text>
          )}
        </View>
  
        <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabList} />
      </View>
    );

  // ------------------ RENDER ------------------
  return (
    <CustomContainer>
         <BackHeader
          label="Profile Details"
          onPress={() => navigation.navigate('HomeScreen')}
          rightView={() => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Setting', {
                  onDeletePost: (deletedId) => {
                    setVideoPosts(prev => prev.filter(p => p?.postData?._id !== deletedId));
                    setPhotoPosts(prev => prev.filter(p => p?.postData?._id !== deletedId));
                  },
                })
              }
            >
              <Image source={ImageConstants.settings} style={styles.imgsty} />
            </TouchableOpacity>
          )}
          profileEdit={true}
          onEdit={() => navigation.navigate('EditProfileScreen')}
        />
      <FlatList
        data={currentPosts}
        numColumns={3}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <MediaItem
            item={item}
            onPress={() =>
              navigation.navigate('ReelViewer', {
                data: currentPosts,
                currentIndex: index,
                onDeletePost: (deletedId) => {
                  setVideoPosts(prev => prev.filter(p => p?.postData?._id !== deletedId));
                  setPhotoPosts(prev => prev.filter(p => p?.postData?._id !== deletedId));
                },
              })
            }
            index={index}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<NotFoundAnime isLoading={isLoading} />}
        contentContainerStyle={{ padding: 15 }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (hasMore && !isLoadingMore && currentPosts.length > 0) {
            getPosts(activeTab, true);
          }
        }}
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator size="small" color={colors.primaryColor} /> : null
        }
      />
    </CustomContainer>
  );
};

// Styles same as before...
const styles = StyleSheet.create({
  // ... तुम्हारा पुराना styles यहाँ paste कर दो
  ml20: { marginLeft: 40 },
  UserImageView: { flexDirection: 'row', alignItems: 'center', marginVertical: wp(10),
    //  marginHorizontal: wp(20)
     },
  userImagesStyle: { height: wp(120), width: wp(120), borderRadius: 100 },
  profileCounts: { flexDirection: 'row', marginLeft: 15 },
  wdh70: { width: '70%' },
  wdh33: { width: '33%' },
  wdh30: { width: '30%' },
  contentTextStyle: { fontFamily: fonts.semiBold, fontSize: wp(14), color: colors.black, textAlign: 'center' },
  contentTitleStyle: { fontFamily: fonts.regular, fontSize: wp(12), color: colors.gray, textAlign: 'center' },
  imgsty: { width: wp(20), height: wp(20) },
});

export default ProfileDetail;