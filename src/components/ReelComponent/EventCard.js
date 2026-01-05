import React, { useState, useEffect, memo } from 'react';
import { View, Text, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import ImageConstants from '../../constants/ImageConstants';
import { ChangeMuteAction } from '../../redux/Slices/VideoMuteSlice';
import { colors, fonts, wp } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import styles from './ReelStyle/ReelCard.Style';
import Icon from 'react-native-vector-icons/Feather';
import ReadMore from '@fawazahmed/react-native-read-more';
import VideoPlayer from './VideoPlayer';
import Video from 'react-native-video';

const EventReelCard = ({
  data,
  idx = 0,
  screen = '',
  isItemOnFocus = false,
  onCommentClick = () => { },
  onShareClick = () => { },
  onMenuClick = () => { },
  screenHeight,
}) => {
  const event = data?.eventData;

  const shouldMute = useSelector(state => state.VideoMuteSlice.isMute);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [shouldPlay, setShouldPlay] = useState(isItemOnFocus);
  const [muteIconVisible, setMuteIconVisible] = useState(false);

  // useEffect(() => {
  //   setShouldPlay(false); // No videos in event, always false
  // }, [isItemOnFocus]);

  useEffect(() => {
    setShouldPlay(isItemOnFocus && isVideoBanner());
  }, [isItemOnFocus]);

  const changeMuteState = () => {
    setMuteIconVisible(true);
    dispatch(ChangeMuteAction(!shouldMute));
    setTimeout(() => {
      setMuteIconVisible(false);
    }, 2000);
  };

  const splitTimeAndMeridiem = (timeStr = '') => {
    if (!timeStr) return { time: '', meridiem: '' };

    const [time, meridiem] = timeStr.split(' ');
    return {
      time,                     // 06:16
      meridiem: meridiem?.toUpperCase(), // PM
    };
  };
  const { time, meridiem } = splitTimeAndMeridiem(event?.time);

  const splitDateAndMonth = (dateStr = '') => {
    if (!dateStr) return { day: '', month: '' };

    const date = new Date(dateStr);

    const day = date.getDate(); // 22

    const monthNames = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ];

    const month = monthNames[date.getMonth()]; // DEC

    return { day, month };
  };

  const { day, month } = splitDateAndMonth(event?.startAt);

  const onPressHandle = (data) => {
    navigation.navigate('EventDetailScreen', { eventDetail: data.eventData })
  }

  const gotoBusiness = (event) => {
    navigation.navigate('ClaimBusinessScreen', {
      _id: event.business_id,
      name: event.business?.name,
      source: 'local',
      fromEvent: true
    });
  }

  const isVideoBanner = () => {
    return (
      event?.bannerMime?.includes('video') ||
      event?.bannerType === '2' ||
      event?.banner?.endsWith('.mp4')
    );
  };


  return (
    <View style={[styles.container]}>

      {isVideoBanner() ? (
        <VideoPlayer
          url={event?.banner}
          shouldPlay={shouldPlay}
          onMuteClick={changeMuteState}
          screen={screen}
          screenHeight={screenHeight}
          // thumbnail={event?.logo}
        />
      ) : (
        <Image
          source={{ uri: event?.banner }}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
          }}
        />
      )}

      <View style={[styles.firstRowContainer(true)]}>
        <TouchableOpacity style={{ marginBottom: 15 }}
          onPress={() => {
            onPressHandle(data)
          }}>
          <Text style={{
            fontFamily: fonts.bold,
            fontWeight: 600,
            fontSize: wp(18),
            color: colors.white,
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
          }}>{event?.title}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: '50%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name={'map-pin'} size={16} color={colors.red} />

              <Text style={{
                fontFamily: fonts.bold,
                fontWeight: 600,
                fontSize: wp(12),
                color: colors.white,
                textTransform: 'uppercase',
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}>
                {` ` + event?.location}
              </Text>
            </View>

            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: wp(29),
                color: colors.white,
                fontWeight: 600,
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}>
              ${event?.entry_fee}
            </Text>
          </View>
          <View style={{ width: '50%', alignSelf: 'flex-end' }}>

            <View style={styles.dateContainer}>

              <View style={styles.dateBox}>
                <Text style={[styles.dateText,{
                   textShadowColor: 'rgba(0,0,0,0.6)',
                   textShadowOffset: { width: 1, height: 1 },
                   textShadowRadius: 3,
                }]}>
                  {day}
                </Text>
                <Text style={[styles.monthText]}>
                  {month}
                </Text>
              </View>

              <View style={styles.borderLeftSty} />

              <View style={styles.dateBox}>
                <Text style={[styles.dateText,{
                   textShadowColor: 'rgba(0,0,0,0.6)',
                   textShadowOffset: { width: 1, height: 1 },
                   textShadowRadius: 3,
                }]}>
                  {time}
                </Text>
                <Text style={styles.monthText}>
                  {meridiem}
                </Text>
              </View>
            </View>

          </View>
        </View>

        <View style={[styles.subFirstRowContiner, { marginTop: 40 }]}>
          <View style={styles.userImageContainer}>
            <View style={styles.imageView}>
              <TouchableOpacity
                onPress={() => {
                  gotoBusiness(event)
                }}>
                <Image
                  source={
                    event.business?.certificate
                      ? { uri: event.business.certificate }
                      : ImageConstants.business_logo
                  }
                  style={styles.imageStyle}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                gotoBusiness(event)
              }} style={styles.usernameStyle}>
              <Text numberOfLines={2} style={styles.nameTxtStyle}>
                {event?.business?.name}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ReadMore
          numberOfLines={2}
          style={styles.descriptionTxtStyle}
          seeMoreStyle={{ color: colors.primaryColor }}
          seeLessStyle={{ color: colors.primaryColor }}>
          {event?.description}
        </ReadMore>

      </View>

      {muteIconVisible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={changeMuteState}
          style={styles.muteContainer}>
          <Image
            source={
              shouldMute ? ImageConstants.audio_off : ImageConstants.audio_on
            }
            style={styles.muteIconStyle}
          />
        </TouchableOpacity>
      )}

    </View>
  );
};

export default memo(EventReelCard, (prev, next) => {
  return (
    prev.data?._id === next.data?._id &&
    prev.isItemOnFocus === next.isItemOnFocus &&
    prev.screenHeight === next.screenHeight
  );
});
