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
  const [imageError, setImageError] = useState(false);

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

  const hasValidImage =
  typeof userDetails?.profile_picture === 'string' &&
  userDetails.profile_picture.trim().length > 0;


  // ------------------ RENDER HEADER ------------------
    const renderHeader = () => (
      <View>
     
        <View style={styles.UserImageView}>
          <View style={styles.wdh30}>
            {/* <Image
              source={
                userDetails?.profile_picture
                  ? { uri: userDetails.profile_picture }
                  : ImageConstants.user
              }
              style={styles.userImagesStyle}
            /> */}
            <Image
                source={
                  !imageError && hasValidImage
                    ? { uri: userDetails.profile_picture }
                    : ImageConstants.user
                }
                onError={() => setImageError(true)}
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