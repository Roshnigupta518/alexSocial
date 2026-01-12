import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform, Alert, ActivityIndicator
} from 'react-native';
import { colors, fonts, wp } from '../../../constants';
import ImageConstants from '../../../constants/ImageConstants';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { useSelector, useDispatch } from 'react-redux';
import database from '@react-native-firebase/database';
import Toast from '../../../constants/Toast';
import NetInfo from '@react-native-community/netinfo';
import NoInternetModal from '../../../components/NoInternetModal';
import { ChatReadAction } from '../../../redux/Slices/ChatReadSlice';
import CustomContainer from '../../../components/container';

const MessageScreen = ({ navigation, route }) => {
  const { chatId, chatObjKey, reciever, isSelfReadable, isOppReadable } =
    route?.params;
  const userInfo = useSelector(state => state.UserInfoSlice.data);
  const dispatch = useDispatch();

  const [messages, setMessages] = useState([]);
  const [isInternetConnected, setIsInternetConnected] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  console.log({ chats: route?.params })
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

  const sendMessageToUser = async msg => {
    try {
      const blockedSnap = await database()
        .ref(`/blocked_users/${reciever?._id}/${userInfo?.id}`)
        .once('value');

      if (blockedSnap.exists()) {
        Toast.error('Blocked', 'User has blocked you');
        return;
      }

      let self_user = { ...userInfo };
      self_user['_id'] = self_user['id'];

      database()
        .ref(`/recent_chat/${chatId}`)
        .update({
          [chatObjKey]: {
            [userInfo?.id]: isSelfReadable,
            [reciever?._id]: isOppReadable,
            isRead: false,
            timestamp: msg?.createdAt,
            last_msg: msg?.text,
            sender: self_user,
            reciever,
          },
        });

      let storeChatPromise = database().ref(`/chats/${chatId}`).push(msg);
      storeChatPromise.catch(err => {
        console.log('err1', err);
        Toast.error('Chat', 'Message not sent, Something went wrong!');
      });
    } catch (err) {
      console.log('err2', err);
      Toast.error('Chat', 'Message not sent, Something went wrong!');
    }
  };

  useEffect(() => {
    // Update the isRead status immediately when the chat is opened
    const readUpdateRef = database().ref(`/recent_chat/${chatId}/${chatObjKey}`);
    readUpdateRef.update({
      isRead: true,
    }).then(() => {
      console.log('✅ Marked as read when opened the chat.');
      dispatch(ChatReadAction(false))
    }).catch(err => {
      console.log('❌ Error marking as read:', err);
    });

    // Listen for new messages
    const reference = database().ref(`/chats/${chatId}`);
    try {
      // reference.on('value', snapshot => {
      //   const data = snapshot.val();
      //   if (data != null) {
      //     const sortedArray = Object.values(data)
      //       .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      //       ?.reverse();
      //     setMessages([...sortedArray]);
      //   }
      // });

      reference.on('value', snapshot => {
        const data = snapshot.val();
        if (!data) return;

        const allMessages = Object.values(data);

        if (isBlocked) {
          const filtered = allMessages.filter(
            msg => msg.user._id !== reciever?._id
          );
          setMessages(filtered.reverse());
        } else {
          setMessages(
            allMessages
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .reverse()
          );
        }
      });

    } catch (err) {
      console.log('err', err);
      Toast.error('Chat', 'Something went wrong');
    }

    return () => {
      reference.off();
      readUpdateRef.off();
    };
  }, []);

  useEffect(() => {
    const checkBlock = async () => {
      try {
        const snap = await database()
          .ref(`/blocked_users/${userInfo?.id}/${reciever?._id}`)
          .once('value');

        setIsBlocked(snap.exists());
      } catch (e) {
        console.log('Block check error', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkBlock();
  }, []);

  const onSend = useCallback((messages = []) => {
    if (isBlocked) {
      Toast.error('Blocked', 'You have blocked this user');
      return;
    }

    console.log({ messages })
    let epochTime = new Date();
    let msg = {
      _id: messages[0]?._id,
      createdAt: epochTime?.toISOString(),
      text: messages[0]?.text,
      user: {
        _id: userInfo?.id,
        name: userInfo?.name,
        avatar: userInfo?.profile_picture,
      },
    };

    sendMessageToUser(msg);
  }, [isBlocked]);

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            marginLeft: 0,  // Removes any left margin on receiver bubbles
            paddingLeft: 10,
          },
          right: {
            marginRight: 0,
          },
        }}
      />
    );
  };

  const blockUser = async (blockedUserId) => {
    if (!blockedUserId) {
      Toast.error('Error', 'User not found');
      return;
    }

    try {
      await database()
        .ref(`/blocked_users/${userInfo?.id}/${blockedUserId}`)
        .set(true);

      setIsBlocked(true); // update UI immediately
      Toast.success('User Blocked', 'You will no longer receive messages');

    } catch (error) {
      console.log('Block user error:', error);
      Toast.error('Error', 'Unable to block user');
    }
  };

  const confirmBlock = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => blockUser(reciever?._id) },
      ],
    );
  };

  const unblockUser = async (unblockedUserId) => {
    if (!unblockedUserId) {
      Toast.error('Error', 'User not found');
      return;
    }

    try {
      await database()
        .ref(`/blocked_users/${userInfo?.id}/${unblockedUserId}`)
        .remove();

      setIsBlocked(false); // update UI immediately
      Toast.success('User Unblocked', 'You can send messages now');

    } catch (error) {
      console.log('Unblock user error:', error);
      Toast.error('Error', 'Unable to unblock user');
    }
  };

  const confirmUnblock = () => {
    Alert.alert(
      'Unblock User',
      'Do you want to unblock this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'default',
          onPress: () => unblockUser(reciever?._id),
        },
      ],
    );
  };

  useEffect(() => {
    const ref = database()
      .ref(`/blocked_users/${reciever?._id}/${userInfo?.id}`);

    ref.on('value', snap => {
      if (snap.exists()) {
        setIsBlocked(true);
      }
    });

    return () => ref.off();
  }, []);

  if (isLoading) {
    return (
      <CustomContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primaryColor} />
        </View>
      </CustomContainer>
    );
  }


  return (
    <>
      <CustomContainer>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: wp(15),
            marginTop: wp(20),
          }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={ImageConstants.leftArrow}
              style={{
                height: wp(20),
                width: wp(20),
                tintColor: colors.black,
              }}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: wp(20),
              color: colors.black,
            }}>
            {reciever?.anonymous_name}
          </Text>

          {/* <TouchableOpacity onPress={isBlocked ? confirmUnblock : confirmBlock}> */}
          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <Image
              source={ImageConstants.h_menu}
              style={{
                tintColor: colors.black,
                resizeMode: 'contain',
                height: wp(20),
                width: wp(20),
                transform: [{ rotate: '90deg' }],
              }}
            />
          </TouchableOpacity>
        </View>

        {showMenu && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
            style={{
              position: 'absolute',
              top: wp(55),
              right: wp(15),
              zIndex: 999,
            }}>

            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: 8,
                elevation: 6,
                paddingVertical: 6,
                minWidth: 140,
              }}>

              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  isBlocked ? confirmUnblock() : confirmBlock();
                }}
                style={{ paddingVertical: 10, paddingHorizontal: 15 }}
              >
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: wp(14),
                    color: isBlocked ? colors.black : colors.red,
                  }}>
                  {isBlocked ? 'Unblock User' : 'Block User'}
                </Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        )}

        {/* Chat VIew */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.extraLightPrimaryColor,
            padding: wp(20),
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            marginTop: 20,
          }}>
          {/* <GiftedChat
            messages={messages}
            onSend={messages => onSend(messages)}
            user={{
              _id: userInfo?.id,
            }}
            renderAvatar={null}  
            renderBubble={renderBubble}
          /> */}

          {isBlocked ? (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: colors.gray, marginBottom: 10 }}>
                You blocked this user
              </Text>

              <TouchableOpacity
                onPress={confirmUnblock}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: colors.black,
                }}>
                <Text style={{ color: colors.white, fontFamily: fonts.medium }}>
                  Unblock User
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <GiftedChat
              messages={messages}
              onSend={messages => onSend(messages)}
              user={{ _id: userInfo?.id }}
              renderAvatar={null}
              renderBubble={renderBubble}
              isTyping={isLoading}
            />
          )}

        </View>
      </CustomContainer>
      {/* <NoInternetModal shouldShow={!isInternetConnected} /> */}
    </>
  );
};

export default MessageScreen;
