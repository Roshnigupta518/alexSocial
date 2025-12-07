import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, HEIGHT, WIDTH, wp } from '../../../constants';
import BackHeader from '../../../components/BackHeader';
import ImageConstants from '../../../constants/ImageConstants';
import { useSelector } from 'react-redux';
import {
  GetUserPostsRequest,
  GetUserProfileRequest,
  MakeFollowedUserRequest,
} from '../../../services/Utills';
import Toast from '../../../constants/Toast';
import verifyUserChatList from '../ChatScreen/ChatUtills/GetChatId';
import NotFoundAnime from '../../../components/NotFoundAnime';
import MediaItem from '../../../components/GridView';
import { SocialLinks } from '../../../components/social';
import TabsHeader from '../../../components/TabsHeader';
import { formatCount, tabList } from '../../../validation/helper';
import CustomContainer from '../../../components/container';

const UserProfileDetail = ({ navigation, route }) => {
  const userInfo = useSelector(state => state.UserInfoSlice.data);
  const chatInfo = useSelector(state => state.ChatListSlice.data);
  const userId = route?.params?.userId;

  // --------------------- STATES ---------------------
  const [userDetails, setUserDetails] = useState(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isFollow, setIsFollow] = useState(false);

  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'photo'

  // TAB WISE STATES
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

  const limit = 15;
  const firstLoadRef = useRef(true);

  const makeFollowUser = () => {
    setIsFollowLoading(true);
    MakeFollowedUserRequest({ follow_user_id: userId })
      .then(res => {
        Toast.success('Request', res?.message);
        setIsFollow(prev => !prev);
      })
      .catch(err => Toast.error('Request', err?.message))
      .finally(() => setIsFollowLoading(false));
  };

  const getUserProfile = () => {
    GetUserProfileRequest(userId)
      .then(res => {
        setUserDetails(res?.result);
        setIsFollow(res?.result?.isFollowed);
      })
      .catch(err => Toast.error('Profile', err?.message));
  };

  const getPosts = async (type, isLoadMore = false) => {
    let page = type === 'video' ? videoPage : photoPage;
    let hasMore = type === 'video' ? videoHasMore : photoHasMore;

    if (isLoadMore && !hasMore) return;

    if (type === 'video') {
      isLoadMore ? setIsVideoLoadingMore(true) : setIsVideoLoading(true);
    } else {
      isLoadMore ? setIsPhotoLoadingMore(true) : setIsPhotoLoading(true);
    }

    try {
      const skip = isLoadMore ? page * limit : 0;
      const fileTypeParam = type === 'video' ? 2 : 1;

      const res = await GetUserPostsRequest(userId, skip, limit, fileTypeParam);
      const newData = res?.result ?? [];

      console.log({newDatalength: newData.length})

      if (type === 'video') {
        setVideoPosts(prev => (isLoadMore ? [...prev, ...newData] : newData));
        setVideoPage(prev => prev + 1);
        if (newData.length < limit) setVideoHasMore(false);
      } else {
        setPhotoPosts(prev => (isLoadMore ? [...prev, ...newData] : newData));
        setPhotoPage(prev => prev + 1);
        if (newData.length < limit) setPhotoHasMore(false);
      }
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

useEffect(() => {
  if (!userId) return;

  setUserDetails(null);
  setVideoPosts([]);
  setPhotoPosts([]);
  setVideoPage(0);
  setPhotoPage(0);
  setVideoHasMore(true);
  setPhotoHasMore(true);
  setActiveTab('video'); 

  const loadInitial = async () => {
    try {
      await getUserProfile();
      // await getPosts('video', false); 
    } catch (err) {
      console.log(err);
    }
  };

  loadInitial();
}, [userId]);

useEffect(() => {
  if (activeTab === 'video') {
    if (videoPosts.length === 0 && videoPage === 0) {
      getPosts('video');
    }
  } else {
    if (photoPosts.length === 0 && photoPage === 0) {
      getPosts('photo');
    }
  }
}, [activeTab]);


useEffect(()=>{
  console.log({videoPosts:videoPosts.length})

},[videoPosts])

  const finalData = activeTab === 'video' ? videoPosts : photoPosts;
  const isLoading = activeTab === 'video' ? isVideoLoading : isPhotoLoading;
  const isLoadingMore = activeTab === 'video' ? isVideoLoadingMore : isPhotoLoadingMore;

  const renderHeader = () => (
    <View>
      <View style={{ marginLeft: -15 }}>
        <BackHeader />
      </View>

      {userDetails && (
        <>
          <View style={styles.UserImageView}>
            <View style={styles.wdh30}>
              <Image
                source={
                  userDetails?.profile_picture
                    ? { uri: userDetails?.profile_picture }
                    : ImageConstants.user
                }
                style={styles.userImagesStyle}
              />
            </View>

            <View style={styles.wdh70}>
              <View style={styles.profileCounts}>
                <View style={styles.wdh33}>
                  <Text style={styles.contentTextStyle}>
                    {formatCount(userDetails?.post_count)}
                  </Text>
                  <Text style={styles.contentTitleStyle}>Posts</Text>
                </View>

                <View style={styles.wdh33}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.push('FollowUsers', {
                        id: userDetails?._id,
                        type: 'followers',
                      })
                    }>
                    <Text style={styles.contentTextStyle}>
                      {formatCount(userDetails?.follower_count)}
                    </Text>
                    <Text style={styles.contentTitleStyle}>Followers</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.wdh33}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.push('FollowUsers', {
                        id: userDetails?._id,
                        type: 'following',
                      })
                    }>
                    <Text style={styles.contentTextStyle}>
                      {formatCount(userDetails?.following_count)}
                    </Text>
                    <Text style={styles.contentTitleStyle}>Following</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.profileCounts, { marginVertical: 10 }]}>
                <View style={styles.wdh33}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('UserPlaces', {
                        id: userDetails?._id,
                        type: 'Cities',
                      })
                    }>
                    <Text style={styles.contentTextStyle}>
                      {formatCount(userDetails?.cityes_count)}
                    </Text>
                    <Text style={styles.contentTitleStyle}>Cities</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.wdh33}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('UserPlaces', {
                        id: userDetails?._id,
                        type: 'Countries',
                      })
                    }>
                    <Text style={styles.contentTextStyle}>
                      {formatCount(userDetails?.countries_count)}
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

          <View style={{ paddingHorizontal: wp(20) }}>
            <Text style={[styles.contentTextStyle, { textAlign: 'left' }]}>
              {userDetails?.anonymous_name}
            </Text>
            {(userDetails?.city || userDetails?.bio) && (
              <Text style={[styles.contentTitleStyle, { textAlign: 'left' }]}>
                {userDetails?.city}
                {'\n'}
                {userDetails?.bio}
              </Text>
            )}
          </View>

          <View style={{ alignItems: 'center', marginTop: wp(10) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={makeFollowUser}
                activeOpacity={0.8}
                style={styles.followBtn}>
                {isFollowLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.followText}>
                    {isFollow ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  verifyUserChatList(userInfo, userDetails, chatInfo)
                    .then(res => {
                      let chatId = Object.keys(res)[0];
                      let chat_users = Object.keys(res[chatId])[0];
                      navigation.navigate('MessageScreen', {
                        chatId,
                        chatObjKey: chat_users,
                        reciever: userDetails,
                        isSelfReadable: true,
                        isOppReadable: true,
                      });
                    })
                    .catch(() =>
                      Toast.error('Chat', 'Something went wrong')
                    );
                }}
                activeOpacity={0.8}
                style={styles.msgBtn}>
                <Text style={styles.followText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
     {userDetails && (
      <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabList} />
       )}
    </View>
  );

  return (
    <CustomContainer>
      <FlatList
        data={finalData}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        renderItem={({ item, index }) => (
          <MediaItem
            item={item}
            onPress={() =>
              navigation.navigate('ReelViewer', {
                data: finalData,
                currentIndex: index,
              })
            }
            index={index}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<NotFoundAnime isLoading={isLoading} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 15 }}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (activeTab === 'video') {
            if (!isVideoLoadingMore && videoHasMore && videoPosts.length > 0) {
              getPosts('video', true);
            }
          } else {
            if (!isPhotoLoadingMore && photoHasMore && photoPosts.length > 0) {
              getPosts('photo', true);
            }
          }
        }}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color={colors.primaryColor} />
          ) : null
        }
      />
    </CustomContainer>
  );
};

// =======================================================
//                       STYLES
// =======================================================
const styles = StyleSheet.create({
  ml20: { marginLeft: 40 },
  UserImageView: { flexDirection: 'row', alignItems: 'center', marginBottom: wp(10) },
  userImagesStyle: { height: wp(120), width: wp(120), borderRadius: 100 },
  profileCounts: { flexDirection: 'row', marginLeft: 15 },
  wdh70: { width: '70%' },
  wdh33: { width: '33%' },
  wdh30: { width: '30%' },
  contentTextStyle: { fontFamily: fonts.semiBold, fontSize: wp(14), color: colors.black, textAlign: 'center' },
  contentTitleStyle: { fontFamily: fonts.regular, fontSize: wp(12), color: colors.gray, textAlign: 'center' },
  followBtn: { backgroundColor: colors.primaryColor, padding: wp(10), minWidth: WIDTH / 2.8, alignItems: 'center', borderRadius: 7, marginRight: 5 },
  msgBtn: { backgroundColor: colors.lightBlack, padding: wp(10), minWidth: WIDTH / 2.8, alignItems: 'center', borderRadius: 7, marginLeft: 5 },
  followText: { fontFamily: fonts.semiBold, fontSize: wp(17), color: colors.white },
});

export default UserProfileDetail;
