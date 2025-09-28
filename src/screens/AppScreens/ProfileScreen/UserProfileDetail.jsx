import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Platform,
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
import NetInfo from '@react-native-community/netinfo';
import NoInternetModal from '../../../components/NoInternetModal';
import { formatCount, tabList } from '../../../validation/helper';
import TabsHeader from '../../../components/TabsHeader';
import NotFoundAnime from '../../../components/NotFoundAnime';
import MediaItem from '../../../components/GridView';
import { SocialLinks } from '../../../components/social';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomContainer from '../../../components/container';

const UserProfileDetail = ({ navigation, route }) => {
  const userInfo = useSelector(state => state.UserInfoSlice.data);
  const chatInfo = useSelector(state => state.ChatListSlice.data);
  const insets = useSafeAreaInsets();

  const [userDetails, setUserDetails] = useState(null);
  const [isFollowLoading, setIsFollowLoading] = useState(true);
  const [isFollow, setIsFollow] = useState(false);
  const [postData, setPostData] = useState([]);
  const [activeTab, setActiveTab] = useState('video');
  const [isLoading, setIsLoading] = useState(false);

  const userId = route?.params?.userId;
  const [isInternetConnected, setIsInternetConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isInternetReachable != undefined) {
        setIsInternetConnected(state.isInternetReachable);
      }
    });
    return () => unsubscribe();
  }, []);

  const makeFollowUser = () => {
    setIsFollowLoading(true);
    MakeFollowedUserRequest({ follow_user_id: route?.params?.userId })
      .then(res => {
        Toast.success('Request', res?.message);
        setIsFollow(!isFollow);
      })
      .catch(err => {
        Toast.error('Request', err?.message);
      })
      .finally(() => setIsFollowLoading(false));
  };

  const getUserProfile = () => {
    setIsFollowLoading(true);
    GetUserProfileRequest(userId || userInfo?.id)
      .then(res => {
        setUserDetails(res?.result);
        setIsFollow(res?.result?.isFollowed);
      })
      .catch(err => {
        Toast.error('Profile', err?.message);
      })
      .finally(() => setIsFollowLoading(false));
  };

  const getUsersPosts = async () => {
    setIsLoading(true);
    GetUserPostsRequest(userId || userInfo?.id)
      .then(res => {
        setPostData(res?.result);
        setIsLoading(false);
      })
      .catch(err => {
        Toast.error('Post', err?.message);
        setIsLoading(false);
      });
  };

  const getFilteredData = () => {
    if (activeTab === 'photo') {
      return postData.filter(item => item?.postData?.post?.mimetype !== 'video/mp4');
    } else if (activeTab === 'video') {
      return postData.filter(item => item?.postData?.post?.mimetype === 'video/mp4');
    }
    return postData;
  };

  useEffect(() => {
    // Reset old data immediately
  setUserDetails(null);
  setPostData([]);
  setIsLoading(true);
  
    getUserProfile();
    getUsersPosts();
  }, [userId]);

  const renderHeader = () => (
    <View>
      <View style={{marginLeft:-15}}>
      <BackHeader />

      </View>

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
            style={{
              backgroundColor: colors.primaryColor,
              padding: wp(10),
              minWidth: WIDTH / 2.8,
              alignItems: 'center',
              borderRadius: 7,
              marginRight: 5,
            }}>
            {isFollowLoading ? (
              <ActivityIndicator size={'small'} color={colors.white} />
            ) : (
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: wp(17),
                  color: colors.white,
                }}>
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
                .catch(err => Toast.error('Chat', 'Something went wrong'));
            }}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.lightBlack,
              padding: wp(10),
              minWidth: WIDTH / 2.8,
              alignItems: 'center',
              borderRadius: 7,
              marginLeft: 5,
            }}>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: wp(17),
                color: colors.white,
              }}>
              Message
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabList} />
    </View>
  );

  const filteredData = getFilteredData();

  return (
    <CustomContainer>
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        renderItem={({ item, index }) => (
          <MediaItem
            item={item}
            onPress={() =>
              navigation.navigate('ReelViewer', {
                data: filteredData,
                currentIndex: index,
              })
            }
            index={index}
          />
        )}
        contentContainerStyle={{ padding: 15 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<NotFoundAnime isLoading={isLoading} />}
        showsVerticalScrollIndicator={false}
      />
    </CustomContainer>
  );
};

const styles = StyleSheet.create({
  ml20: { marginLeft: 40 },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  UserImageView: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: wp(20),
    marginBottom: wp(10),
  },
  userImagesStyle: {
    height: wp(120),
    width: wp(120),
    borderRadius: 100,
  },
  profileCounts: {
    flexDirection: 'row',
    marginLeft: 15,
  },
  wdh70: { width: '70%' },
  wdh33: { width: '33%' },
  wdh30: { width: '30%' },
  contentTextStyle: {
    fontFamily: fonts.semiBold,
    fontSize: wp(14),
    color: colors.black,
    textAlign: 'center',
  },
  contentTitleStyle: {
    fontFamily: fonts.regular,
    fontSize: wp(12),
    color: colors.gray,
    textAlign: 'center',
  },
});

export default UserProfileDetail;

