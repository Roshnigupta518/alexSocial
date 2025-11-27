import React, { useState, useEffect, memo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import ImageConstants from '../../constants/ImageConstants';
import { ChangeMuteAction } from '../../redux/Slices/VideoMuteSlice';
import { colors, fonts, wp } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import styles from './ReelStyle/ReelCard.Style';

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

  useEffect(() => {
    setShouldPlay(false); // No videos in event, always false
  }, [isItemOnFocus]);

  const changeMuteState = () => {
    setMuteIconVisible(true);
    dispatch(ChangeMuteAction(!shouldMute));
    setTimeout(() => setMuteIconVisible(false), 2000);
  };

  function formatEventDate(date, time) {
    return `${date} • ${time}`;
  }

  const onPressHandle = (data) => {
    navigation.navigate('EventDetailScreen', {data: data.eventData})
  }

  return (
    <View style={[styles.container, { height: screenHeight }]}>
      {/* EVENT BANNER */}
      
        <Image
          source={{ uri: event?.image?.[0] }}
          style={[styles.uploadedImageStyle(true), { height: screenHeight }]}
        />
     

      {/* MAIN CARD CONTENT */}
      <View style={[styles.firstRowContainer(true)]}>

        {/* Profile Row */}
        <View style={styles.subFirstRowContiner}>
          <View style={styles.userImageContainer}>
            <View style={styles.imageView}>
            <TouchableOpacity
              onPress={() => {
                onPressHandle(data)
              }}>
              <Image
                source={
                  event?.logo?.trim()
                    ? { uri: event.logo }
                    : ImageConstants.business_logo
                }
                style={styles.imageStyle}
              />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                onPressHandle(data)
              }} style={styles.usernameStyle}>
              <Text numberOfLines={1} style={styles.nameTxtStyle}>
                {event?.title}
              </Text>
              <Text numberOfLines={1} style={styles.locationTxtStyle}>
                {event?.location}
              </Text>
            </TouchableOpacity>
          </View>

          {/* <TouchableOpacity onPress={onMenuClick}>
            <Image source={ImageConstants.h_menu} style={styles.hmenuStyle} />
          </TouchableOpacity> */}
        </View>

        {/* Description */}
        <Text style={styles.descriptionTxtStyle}>
          {event?.description}
        </Text>

        {/* Date + Time */}
        <Text
          style={{
            fontFamily: fonts.semiBold,
            fontSize: wp(13),
            color: colors.primaryColor,
            marginTop: 4,
          }}
        >
          {formatEventDate(event?.date, event?.time)}
        </Text>

        {/* Fee */}
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: wp(13),
            color: colors.white,
            marginTop: 4,
          }}
        >
          Entry Fee: ₹{event?.entry_fee}
        </Text>

      </View>

      {/* Mute icon overlay */}
      {muteIconVisible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={changeMuteState}
          style={styles.muteContainer}
        >
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
