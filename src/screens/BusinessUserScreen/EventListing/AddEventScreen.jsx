import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {colors, fonts, wp} from '../../../constants';
import BackHeader from '../../../components/BackHeader';
import {
  BusinessUserInputs,
  BusinessUserDescriptionInput,
  BusinessImagePicker,
} from '../commonComponents/EventUserInputs';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import CustomButton from '../../../components/CustomButton';
import ImageConstants from '../../../constants/ImageConstants';
import DateSheet from '../commonComponents/DateSheet';
import TimeSheet from '../commonComponents/TimeSheet';
import Toast from '../../../constants/Toast';
import EventValidation from './EventValidation';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {CreateEventRequest, getMyBusinessListRequest} from '../../../services/Utills';
import moment from 'moment';
import NoInternetModal from '../../../components/NoInternetModal';
import NetInfo from '@react-native-community/netinfo';
import CustomContainer from '../../../components/container';
import CustomPicker from '../../../components/customPicker';

const AddEventScreen = ({navigation}) => {
  const dateRef = useRef();
  const timeRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [eventDate, setEventDate] = useState(null);
  const [eventTime, setEventTime] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null)
  const [eventImage, setEventImage] = useState([]);
  const [isInternetConnected, setIsInternetConnected] = useState(true);
  const [business, setBusiness] = useState(null)
  const [businessList, setBusinessList] = useState([])

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

  const [state, setState] = useState({
    event_name: '',
    address: '',
    phone: '',
    description: '',
    fee: '',
    location: '',
    lat: null,
    lng: null,
    showLocation: '',
  });

  const getBusinessList = () => {
    try {
      setIsLoading(true)
      getMyBusinessListRequest()
        .then(res => {
          const data = res?.result
          let tempSubAct =
          data.map(item => ({
            label: item.name,
            value: item._id,
          })) || [];
          setBusinessList(tempSubAct || []);

        })
        .catch(err => {
          Toast.error('Business', err?.message);
        })
        .finally(() => setIsLoading(false));
    } catch (err) {
      Toast.error('Business', JSON.stringify(err));
      setIsLoading(false);
    }
  };

  useEffect(()=>{
    getBusinessList()
  },[])

  const SubmitEvent = () => {
    console.log({eventDate, eventTime})
    if (
      !EventValidation(
        logoImage,
        bannerImage,
        state.event_name,
        state.phone,
        state.description?.trim(),
        eventDate,
        eventTime,
        eventImage,
        state.fee,
        state.location,
        state.lat,
        state.lng,
        business
      )
    ) {
      return;
    } else {
      setIsLoading(true);

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      let data = new FormData();
      data.append('title', state.event_name);
      data.append('description', state.description);
      data.append('location', state.location);
      data.append('date', moment(eventDate, 'YYYY-MM-DD').format('YYYY-MM-DD'));
      data.append('time', eventTime);
      data.append('latitude', state.lat);
      data.append('longitude', state.lng);
      data.append('phone', '+' + state.phone?.replace('+', ''));
      data.append('entry_fee', state.fee);
      {eventImage?.map((i)=>{
        data.append('image', i);
      })}
      {logoImage?.map((i)=>{
        data.append('logo', i);
      })}
      {bannerImage?.map((i)=>{
        data.append('banner', i);
      })}
      data.append('timezone', timezone);
      data.append('business_id', business)
      console.log({data})
      CreateEventRequest(data)
        .then(res => {
          Toast.success('Event', res?.message);
          navigation.goBack();
        })
        .catch(err => {
          Toast.error('Event', err?.message);
        })
        .finally(() => setIsLoading(false));
    }
  };

  function getTimeDifferenceInHours(time1, time2) {
    // Parse the time strings into moment objects with a common date
    const momentTime1 = moment(time1, 'hh:mm A');
    const momentTime2 = moment(time2, 'hh:mm A');

    // Calculate the difference in hours
    const differenceInHours = momentTime2.diff(momentTime1, 'hours', true);

    return differenceInHours;
  }

  const removeImage = index => {
    setEventImage(prev => prev.filter((_, i) => i !== index));
  };  

  const removeImageLogo = index => {
    setLogoImage(prev => prev.filter((_, i) => i !== index));
  }

  const removeBannerLogo = (index) => {
    setBannerImage(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <>
      <CustomContainer>
        <BackHeader label="Events" />

        <View
          style={{
            padding: wp(20),
            flex: 1,
          }}>
          <KeyboardAvoidingScrollView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            showsVerticalScrollIndicator={false}>
            <BusinessImagePicker
              label="Add a symbol of your organization."
              image={logoImage}
              theme="light"
              getImageFile={res => setLogoImage(res)}
              onRemoveImage={removeImageLogo}
            />
             <BusinessImagePicker
              label="Add Banner"
              image={bannerImage}
              theme="light"
              getImageFile={res => setBannerImage(res)}
              onRemoveImage={removeBannerLogo}
            />

            <BusinessUserInputs
              label="Add Event Name"
              placeholder="Write here"
              theme="light"
              value={state.event_name}
              onChangeText={txt =>
                setState(prevState => ({...prevState, event_name: txt}))
              }
            />

            <View
              style={{
                marginBottom: wp(13),
              }}>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: wp(15),
                  color: colors.black,
                }}>
                Add Address
              </Text>
              <GooglePlacesAutocomplete
                minLength={3} // minimum length of text to search
                placeholder="Search"
                autoFocus={false}
                returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                keyboardAppearance={'light'} // Can be left out for default keyboardAppearance https://facebook.github.io/react-native/docs/textinput.html#keyboardappearance
                listViewDisplayed={true} // true/false/undefined
                fetchDetails={true}
                predefinedPlaces={[]} 
                onPress={(data, details = null) => {
                  setState(prevState => ({
                    ...prevState,
                    location: data?.description,
                    showLocation: data?.description,
                    lat: Number(details?.geometry?.location?.lat),
                    lng: Number(details?.geometry?.location?.lng),
                  }));
                }}
                renderDescription={row => row.description}
                GooglePlacesDetailsQuery={{
                  fields: ['geometry'],
                }}
                query={{
                  key: 'AIzaSyAbFHI5aGGL3YVP0KvD9nDiFKsi_cX3bS0',
                  language: 'en',
                }}
                textInputProps={{placeholderTextColor: colors.gray}}
                styles={{
                  textInput: {
                    backgroundColor: colors.lightPrimaryColor,
                    // borderWidth: 1,
                    borderRadius: 7,
                    color: colors.black,
                  },
                }}
                nearbyPlacesAPI="GooglePlacesSearch"
                GoogleReverseGeocodingQuery={{}}
                GooglePlacesSearchQuery={{
                  rankby: 'distance',
                  type: 'cafe',
                }}
                filterReverseGeocodingByTypes={[
                  'locality',
                  'administrative_area_level_3',
                ]}
                debounce={200}
                timeout={20000}
                keyboardShouldPersistTaps={'handled'}
              />
            </View>

            <BusinessUserInputs
              label="Add Mobile Number"
              placeholder="Write here"
              keyboardType={'number-pad'}
              maxlenght={15}
              theme="light"
              value={state.phone}
              onChangeText={txt =>
                setState(prevState => ({...prevState, phone: txt}))
              }
            />

            <BusinessUserDescriptionInput
              label="Add Event Description"
              placeholder="Write here"
              value={state.description}
              theme="light"
              onChangeText={txt =>
                setState(prevState => ({...prevState, description: txt}))
              }
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: wp(13),
              }}>
              <TouchableOpacity
                onPress={() => dateRef.current?.show()}
                style={{
                  padding: wp(10),
                  backgroundColor: colors.lightPrimaryColor,
                  flex: 0.47,
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: wp(13),
                    color: colors.black,
                  }}>
                  {eventDate ? eventDate : 'Event Date'}
                </Text>

                <Image
                  source={ImageConstants.calendar}
                  style={{
                    tintColor: colors.primaryColor,
                    height: wp(20),
                    width: wp(20),
                  }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => timeRef.current?.show()}
                style={{
                  padding: wp(10),
                  backgroundColor: colors.lightPrimaryColor,
                  flex: 0.47,
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: wp(13),
                    color: colors.black,
                  }}>
                  {eventTime ? eventTime : 'Select Time'}
                </Text>

                <Image
                  source={ImageConstants.timer}
                  style={{
                    tintColor: colors.primaryColor,
                    height: wp(20),
                    width: wp(20),
                  }}
                />
              </TouchableOpacity>
            </View>

            <BusinessImagePicker
              label="Add photos of your Events"
              image={eventImage}
              theme="light"
              multiple={true}
              // getImageFile={res => setEventImage(res)}
              getImageFile={res => {
                console.log('Images received:', res); // ✅ ab array dikhega
                setEventImage(prev => [...prev, ...res]);
              }}
              onRemoveImage={removeImage}
            />

               <CustomPicker
                  items={businessList}
                  label={'Select Business'}
                  placeholder=''
                  value={business}
                  onValueChange={(val)=>setBusiness(val)}
                  fontFamily={fonts.medium}
                />

            <BusinessUserInputs
              label="Add Entry Fee"
              placeholder="Write here"
              value={state.fee}
              theme="light"
              keyboardType="decimal-pad"
              onChangeText={txt => {
                // Allow only numbers and one decimal point
                let value = txt.replace(/[^0-9.]/g, '');
              
                // Prevent more than one decimal
                if ((value.match(/\./g) || []).length > 1) {
                  return;
                }
              
                // Limit to 2 digits after decimal
                if (value.includes('.')) {
                  const [int, dec] = value.split('.');
                  value = int + '.' + dec.slice(0, 2);
                }
              
                setState(prev => ({ ...prev, fee: value }));
              }}
            />
          </KeyboardAvoidingScrollView>

          <TimeSheet
            ref={timeRef}
            onSuccess={res => {
              console.log(res);
              if (eventDate != null) {
                if ((eventDate, res)) {
                  let todayDate = new Date();
                  const hoursDifference = getTimeDifferenceInHours(
                    moment().format('hh:mm a'),
                    res,
                  );
                  if (
                    (hoursDifference >= 0 &&
                      moment(eventDate).format('DD-YY-YYYY') ==
                        moment(todayDate?.toISOString()).format(
                          'DD-YY-YYYY',
                        )) ||
                    moment(eventDate).format('DD-YY-YYYY') !=
                      moment(todayDate?.toISOString()).format('DD-YY-YYYY')
                  ) {
                    setEventTime(res);
                  } else {
                    Toast.error('Time', 'Time should be upcoming time.');
                  }
                }
              } else {
                Toast.error('Date', 'Please select date first.');
              }
            }}
          />
          <DateSheet ref={dateRef} onSuccess={res => setEventDate(res)} />
        </View>

        <View
          style={{
            marginBottom: 15,
          }}>
          <CustomButton
            isLoading={isLoading}
            disabled={isLoading}
            label="Save Details"
            onPress={SubmitEvent}
          />
        </View>
      </CustomContainer>
      {/* <NoInternetModal shouldShow={!isInternetConnected} /> */}
    </>
  );
};

export default AddEventScreen;
