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

    const [day, month, year] = dateStr.split('-');

    const monthNames = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ];

    return {
      day,                         // 14
      month: monthNames[Number(month) - 1], // DEC
    };
  };

  const { day, month } = splitDateAndMonth(event?.date);


  const onPressHandle = (data) => {
    navigation.navigate('EventDetailScreen', { data: data.eventData })
  }

  return (
    <View style={[styles.container, { height: screenHeight }]}>
      <ImageBackground
        source={{ uri: event?.image?.[0] }}
        style={[styles.uploadedImageStyle(true), { height: screenHeight }]}
        resizeMode='contain'
        >

        <View style={[styles.firstRowContainer(true)]}>

          <TouchableOpacity style={{marginBottom:60}}
           onPress={() => {
            navigation.navigate('ClaimBusinessScreen', {
              _id: event.business_id,          // 👈 IMPORTANT
              name: event.business?.name,
              source: 'local',
              fromEvent: true
            });
            
          }}>
            <Text style={{
               fontFamily: fonts.bold,
               fontWeight: 600,
               fontSize: wp(18),
               color: colors.white,
               textTransform: 'uppercase',
               textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    transform: [{ rotate: '-12deg' }],
            }}>{event?.business?.name}</Text>
          </TouchableOpacity>
       
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: '50%' }}>
              <View style={{ flexDirection: 'row',alignItems:'center' }}>
                <Icon name={'map-pin'} size={16} color={colors.red} />

                <Text style={{
                  fontFamily: fonts.bold,
                  fontWeight: 600,
                  fontSize: wp(12),
                  color: colors.white,
                  textTransform: 'uppercase'
                }}>
                  {` `+event?.location}
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: wp(29),
                  color: colors.white,
                  fontWeight: 600,
                }}>
                ${event?.entry_fee}
              </Text>
            </View>
            <View style={{ width: '50%', alignSelf: 'flex-end' }}>

              <View style={styles.dateContainer}>

                <View style={styles.dateBox}>
                  <Text style={styles.dateText}>
                    {day}
                  </Text>
                  <Text style={styles.monthText}>
                    {month}
                  </Text>
                </View>

                <View style={styles.borderLeftSty} />

                <View style={styles.dateBox}>
                  <Text style={styles.dateText}>
                    {time}
                  </Text>
                  <Text style={styles.monthText}>
                    {meridiem}
                  </Text>
                </View>
              </View>

            </View>
          </View>

          <View style={[styles.subFirstRowContiner,{marginTop:40}]}>
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
                <Text numberOfLines={2} style={styles.nameTxtStyle}>
                  {event?.title}
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
      </ImageBackground>
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
