import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  FlatList, DeviceEventEmitter
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, fonts, HEIGHT, WIDTH, wp } from '../../../constants';
import BackHeader from '../../../components/BackHeader';
import ImageConstants from '../../../constants/ImageConstants';
import { AddToFavExploreRequest, CreateStoryToEvent, GetEventDetailById } from '../../../services/Utills';
import Toast from '../../../constants/Toast';
import ReadMore from '@fawazahmed/react-native-read-more';
import moment from 'moment';
import NetInfo from '@react-native-community/netinfo';
import NoInternetModal from '../../../components/NoInternetModal';
import CustomContainer from '../../../components/container';
import st from '../../../global/styles';
import CustomButton from '../../../components/CustomButton';
import NotFoundAnime from '../../../components/NotFoundAnime';
import Video from 'react-native-video';
import { api, BASE_URL } from '../../../services/WebConstants';
import Storage from '../../../constants/Storage';

const EventDetailScreen = ({ navigation, route }) => {
  const { eventDetail } = route?.params;
  console.log({ EventDetailScreen: eventDetail })
  const [data, setData] = useState()
  const [isInternetConnected, setIsInternetConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddStoryBtn, setShowAddStoryBtn] = useState(false);

  useEffect(() => {
    if (data?.startAt) {
      const eventStart = moment.utc(data.startAt);
      setShowAddStoryBtn(eventStart.isSameOrAfter(moment()));
    }
  }, [data]);

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

  const getAllData = () => {
    setIsLoading(true);
    GetEventDetailById(eventDetail._id || '')
      .then(res => {
        setData(res?.result || []);
         console.log('GetEventDetailById', res?.result)
      })
      .catch(err => {
        Toast.error('Event Details', err?.message);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(()=>{
    getAllData();
  },[eventDetail])

  const redirectOnMap = () => {
    console.log('data?.coordinates[0]=-=-=-', JSON.stringify(data));
    let fullAddress = `${data?.latitude || data?.loc?.coordinates[0]},${data?.longitude || data?.loc?.coordinates[1]
      }`;

    console.log('`maps:0,0?q=${fullAddress}`', `maps:0,0?q=${fullAddress}`);

    const url = Platform.select({
      ios: `maps:0,0?q=${fullAddress}`,
      android: `geo:0,0?q=${fullAddress}`,
    });

    Linking.openURL(url);
  };

  const addEventToStory = async () => {
    setIsLoading(true);
    const formdata = new FormData();
    formdata.append(
      'tagBussiness',
      JSON.stringify({
        place_id: data?.business_id._id,
        name: data?.business_id.name,
      }),
    );
    try{
      let temp_token = await Storage.get('userdata');
    const requestOptions = {
      method: "POST",
      headers: {
        Authorization: 'Bearer ' + temp_token?.token,
         'Content-Type': 'multipart/form-data'
      },
      body: formdata,
    };

    const url = BASE_URL + api.addEventStory + data._id;
    console.log({ url, formdata: JSON.stringify(formdata) });

   
    const response = await fetch(url, requestOptions);
    const result = await response.json();

    if (result?.status) {
      console.log('CreateStoryToEvent=>',result)
      Toast.success('Event', result?.message);
      // DeviceEventEmitter.emit('REFRESH_STORIES');
      setTimeout(() => {
        DeviceEventEmitter.emit('REFRESH_STORIES');
      }, 1500);
      
    }else{
      Toast.error('Event', result?.message);
      setIsLoading(false)
    }
  }catch(err){
    Toast.error('Event', err?.message);
    setIsLoading(false)
  }finally{
    setIsLoading(false)
  }

  };

  const isVideoBanner = () => {
    return (
      data?.bannerMime?.includes('video') ||
      data?.bannerType === '2' ||
      data?.banner?.endsWith('.mp4')
    );
  };  

  return (
    <>
      <CustomContainer>
        {data?(
        <View style={{flex:1}}>
        {/* <ImageBackground
          source={data.banner ? { uri: data.banner } : ImageConstants.event_banner}
          style={{
            height: HEIGHT / 3,
            width: WIDTH,
          }}>
          <SafeAreaView>
            <BackHeader />
          </SafeAreaView>
        </ImageBackground> */}

<View style={{ height: HEIGHT / 3, width: WIDTH }}>
  {isVideoBanner() ? (
    <Video
      source={{ uri: data?.banner }}
      style={{ height: '100%', width: '100%' }}
      resizeMode="cover"
      muted={true}
      repeat={true}
      paused={false}
    />
  ) : (
    <ImageBackground
      source={
        data?.banner
          ? { uri: data.banner }
          : ImageConstants.event_banner
      }
      style={{ height: '100%', width: '100%' }}
    />
  )}

  {/* Header always on top */}
  <SafeAreaView style={{ position: 'absolute', top: 0, width: '100%' }}>
    <BackHeader />
  </SafeAreaView>
</View>


        <View
          style={{
            flex: 1,
            backgroundColor: colors.white,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            marginTop: -40,
          }}>
          <View
            style={{
              backgroundColor: colors.white,
              padding: 6,
              borderRadius: 80,
              alignSelf: 'center',
              marginTop: -50,
            }}>
            <Image
              source={{ uri: data?.logo }}
              style={{
                height: wp(80),
                width: wp(80),
                borderRadius: 40,
              }}
            />
          </View>

          <ScrollView>
            <View
              style={{
                margin: wp(15),
              }}>
              <View
                style={{
                  alignItems: 'center',
                }}>
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: wp(16),
                      color: colors.black,
                    }}>
                    {data?.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: wp(13),
                      color: colors.black,
                    }}>
                    {data?.subTitle}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={ImageConstants.calendar}
                    style={{
                      height: wp(20),
                      width: wp(20),
                      tintColor: colors.primaryColor,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      color: colors.primaryColor,
                      fontSize: wp(14),
                      marginLeft: wp(5),
                    }}>
                    {moment(data?.startAt, 'YYYY-MM-DD').format('dddd, DD MMMM')}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={ImageConstants.timer}
                    style={{
                      height: wp(20),
                      width: wp(20),
                      tintColor: colors.primaryColor,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      color: colors.primaryColor,
                      fontSize: wp(14),
                      marginLeft: wp(5),
                    }}>
                    {data?.time}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  marginVertical: wp(20),
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: colors.lightPrimaryColor,
                }}>
                {data?.location?.length > 0 && data?.location != undefined && (
                  <View
                    style={{
                      flexDirection: 'row',
                      marginBottom: 4,
                    }}>
                    <View style={{ width: '8%' }}>
                      <Image
                        source={ImageConstants.blue_location}
                        style={{
                          height: wp(23),
                          width: wp(23),
                          tintColor: colors.primaryColor,
                        }}
                      />
                    </View>
                    <View style={{ width: '92%' }}>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: wp(12),
                          color: colors.black,
                          paddingHorizontal: 5,
                        }}>
                        {data?.location}
                      </Text>
                    </View>
                  </View>
                )}

                {data?.phone?.length > 0 && data?.phone != undefined && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <View style={st.wdh60}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <View style={st.wdh10}>
                          <Image
                            source={ImageConstants.phone}
                            style={{
                              height: wp(23),
                              width: wp(23),
                              tintColor: colors.primaryColor,
                            }}
                          />
                        </View>
                        <View style={st.wdh50}>
                          <Text
                            style={{
                              fontFamily: fonts.regular,
                              fontSize: wp(12),
                              color: colors.black,
                              paddingHorizontal: 5,
                            }}>
                            {data?.phone}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        width: '40%'
                      }}>
                      <Image
                        source={ImageConstants.wallet}
                        style={{
                          height: wp(23),
                          width: wp(23),
                          tintColor: colors.primaryColor,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: fonts.semiBold,
                          fontSize: wp(12),
                          color: colors.black,
                          paddingHorizontal: 5,
                        }}>
                        $ {data?.entry_fee}{' '}
                        <Text
                          style={{ fontFamily: fonts.regular, fontSize: wp(10) }}>
                          (entry fee)
                        </Text>
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {data?.description && (
                <View>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: wp(16),
                      color: colors.primaryColor,
                    }}>
                    Business Description
                  </Text>
                  <ReadMore
                    numberOfLines={4}
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: wp(13),
                      color: colors.black,
                    }}
                    seeMoreStyle={{ color: colors.primaryColor }}
                    seeLessStyle={{ color: colors.primaryColor }}>
                    {data?.description}
                  </ReadMore>
                </View>
              )}

              {data?.image?.length > 0 && (
                <View style={{ marginTop: 30 }}>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: wp(16),
                      color: colors.primaryColor,
                    }}>
                    Photos
                  </Text>

                  <View
                    style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <FlatList
                      data={[...data?.image] || []}
                      horizontal={true}
                      scrollEnabled={true}
                      showsHorizontalScrollIndicator={false}
                      renderItem={({ item, index }) => {
                        return (
                          <Image
                            source={{ uri: item }}
                            style={{
                              height: wp(230),
                              width: wp(230),
                              resizeMode: 'contain',
                              margin: 5,
                            }}
                          />
                        );
                      }}
                    />
                  </View>
                </View>
              )}

              {!isNaN(Number(data?.latitude)) &&
                !isNaN(Number(data?.longitude)) && (
                  <View
                    style={{
                      height: HEIGHT / 5,
                      marginTop: wp(30),
                    }}>
                    <MapView
                      provider={PROVIDER_GOOGLE} // remove if not using Google Maps
                      style={{
                        flex: 1,
                        borderRadius: 20,
                      }}
                      region={{
                        latitude:
                          Number(data?.latitude) ||
                          Number(data?.loc?.coordinates[0]),

                        longitude:
                          Number(data?.longitude) ||
                          Number(data?.loc?.coordinates[1]),
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.0121,
                      }}
                    />

                    <View
                      style={{
                        position: 'absolute',
                        bottom: 20,
                        alignSelf: 'center',
                      }}>
                      <TouchableOpacity
                        onPress={redirectOnMap}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: colors.primaryColor,
                          padding: wp(15),
                          width: WIDTH / 1.3,
                          borderRadius: 10,
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{
                            fontFamily: fonts.semiBold,
                            fontSize: wp(16),
                            color: colors.white,
                          }}>
                          Get Direction
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {showAddStoryBtn && (
                <View style={{ margin: 15 }}>
                  <CustomButton
                    isLoading={isLoading}
                    disabled={isLoading}
                    label="Add Event Story"
                    onPress={addEventToStory}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        </View>
      ):
      <NotFoundAnime isLoading={isLoading} />
      }
        
      </CustomContainer>
      {/* <NoInternetModal shouldShow={!isInternetConnected} /> */}
    </>
  );
};

export default EventDetailScreen;
