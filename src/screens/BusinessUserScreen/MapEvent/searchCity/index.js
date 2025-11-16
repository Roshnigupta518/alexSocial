import {
  StyleSheet, Text, View, TouchableOpacity,
  FlatList,
  Image,
  Platform,
} from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import CustomContainer from '../../../../components/container'
import { colors, wp, fonts } from '../../../../constants'
import ImageConstants from '../../../../constants/ImageConstants'
import { GetTrendingCitiesRequest } from '../../../../services/Utills'
import Toast from '../../../../constants/Toast'
import { useDispatch } from 'react-redux';
import NotFoundAnime from '../../../../components/NotFoundAnime'
import SearchInput from '../../../../components/SearchInput'
import { CityMapAction } from '../../../../redux/Slices/CityMapSlice'

const SearchCity = ({ navigation }) => {
  const dispatch = useDispatch();
  const [searchTxt, setSearchTxt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const [googleResults, setGoogleResults] = useState([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [allCities, setAllCities] = useState([]);
  const [searchedCities, setSearchedCities] = useState([]);

  const GOOGLE_API_KEY = 'AIzaSyAbFHI5aGGL3YVP0KvD9nDiFKsi_cX3bS0';

  const staticOptions = [
    {
      icon: ImageConstants.globe,
      label: 'Current Location',
      action: () => {
        dispatch(
          CityMapAction({
            location_title: 'Current Location',
            location_type: 'all',
            location_coordinates: null,
            location_distance: null,
            city: null,
          }),
        );
        navigation.goBack();
      },
    },
  ];


  const getCities = () => {
    setIsLoading(true);
    GetTrendingCitiesRequest()
      .then(res => {
        setAllCities(res?.result || []);
        setSearchedCities(res?.result || []);
      })
      .catch(err => {
        Toast.error('Cities', err?.message);
      })
      .finally(() => setIsLoading(false));
  };

  const _renderFirstList = ({ item, index }) => {
    return (
      <View style={styles.firstListView}>
        <TouchableOpacity
          onPress={item?.action}
          style={styles.firstRowItemStyle}
        >
          <Image source={item?.icon} style={styles.imageIconStyle} />
          <Text style={styles.itemLabelStyle}>{item?.label}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const _renderCityList = ({ item, index }) => {
    return (
      <View style={styles.cityViewStyle}>
        <TouchableOpacity
          onPress={() => handleSelectCity(item?._id)}
          style={styles.firstRowItemStyle}>
          <Image
            source={ImageConstants.location}
            style={{
              height: wp(30),
              width: wp(30),
              resizeMode: 'contain',
              tintColor: colors.black,
            }}
          />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: wp(18),
              color: colors.black,
              marginLeft: 20,
            }}>
            {item?._id}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGoogleCity = ({ item }) => (
    <View style={styles.cityViewStyle}>
      <TouchableOpacity
        onPress={() => handleSelectCity(item?.structured_formatting?.main_text)}
        style={styles.firstRowItemStyle}>
        <Image
          source={ImageConstants.location}
          style={{
            height: wp(30),
            width: wp(30),
            resizeMode: 'contain',
            tintColor: colors.black,
          }}
        />
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: wp(18),
            color: colors.black,
            marginLeft: 20,
          }}>
          {item?.description}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const CityRenderView = () => {
    return (
      <View
        style={{
          backgroundColor: colors.lightBlack,
          padding: wp(10),
        }}>
        <Text
          style={{
            fontFamily: fonts.semiBold,
            fontSize: wp(16),
            color: colors.white,
          }}>
          Trending Cities
        </Text>
      </View>
    );
  };

  const StaticListRenderingWithTitle = () => {
    return (
      <FlatList
        data={staticOptions}
        renderItem={_renderFirstList}
        ListFooterComponent={<CityRenderView />}
        ItemSeparatorComponent={() => <View style={styles.firstRowBorderLine} />}
      />
    );
  };

  useEffect(() => {
    getCities();
  }, []);

  const handleSearch = async txt => {
    setSearchTxt(txt);
    if (!txt.trim()) {
      setFilteredCities(allCities);
      setGoogleResults([]);
      return;
    }

    const keyword = txt.toLowerCase();
    const filtered = allCities.filter(city =>
      city?._id?.toLowerCase().includes(keyword),
    );

    if (filtered.length > 0) {
      setFilteredCities(filtered);
      setGoogleResults([]);
    } else {
      setFilteredCities([]);
      await searchFromGoogle(txt);
    }
  };

  const searchFromGoogle = async text => {
    try {
      setLoadingGoogle(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text,
        )}&types=(cities)&key=${GOOGLE_API_KEY}`,
      );
      const data = await response.json();
      if (data?.status === 'OK') {
        setGoogleResults(data?.predictions || []);
        console.log({ predictions: data?.predictions })
      } else {
        setGoogleResults([]);
      }
    } catch (error) {
      console.log('Google search error:', error);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSelectCity = async (cityName) => {
    try {
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          cityName
        )}&key=${GOOGLE_API_KEY}`
      );
      const geoData = await geoResponse.json();
  
      if (geoData.results?.[0]) {
        const { lat, lng } = geoData.results[0].geometry.location;
  
        dispatch(
          CityMapAction({
            location_title: cityName,
            location_type: 'city',
            location_coordinates: [lat, lng],
            location_distance: null,
            city: cityName,
          })
        );
      } else {
        throw new Error("No results");
      }
    } catch (error) {
      console.log('Geocoding failed, fallback:', error);
      dispatch(
        CityMapAction({
          location_title: cityName,
          location_type: 'city',
          location_coordinates: null,
          location_distance: null,
          city: cityName,
        })
      );
    } finally {
      navigation.navigate('ExploreScreen');
    }
  };
 
  return (
    <CustomContainer>
      <View style={styles.subViewContainer}>
        <View style={styles.searchView}>
          <SearchInput
            containerStyle={styles.inputStyle}
            value={searchTxt}
            onChangeText={handleSearch}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelButtonStyle}>
            <Text style={styles.cancelTxtStyle}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.parentListView}>
          <FlatList
            data={
              searchTxt.length === 0
                ? allCities
                : filteredCities.length > 0
                  ? filteredCities
                  : googleResults
            }
            renderItem={
              filteredCities.length > 0 || searchTxt.length === 0
                ? _renderCityList
                : renderGoogleCity
            }
            keyExtractor={(item, index) => index.toString()}
            ItemSeparatorComponent={() => <View style={styles.firstRowBorderLine} />}
            ListEmptyComponent={<NotFoundAnime isLoading={isLoading} />}
            ListHeaderComponent={<StaticListRenderingWithTitle />}
          />
        </View>
      </View>

    </CustomContainer>
  )
}

export default SearchCity


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  subViewContainer: {
    flex: 1,
  },

  searchView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS == 'android' ? wp(20) : wp(20),
    marginHorizontal: 10,
  },

  inputStyle: {
    flex: 1,
  },

  cancelButtonStyle: {
    marginLeft: wp(10),
  },

  cancelTxtStyle: {
    fontFamily: fonts.medium,
    fontSize: wp(15),
    color: colors.black,
  },

  parentListView: {
    flex: 1,
  },

  firstListView: {
    marginHorizontal: wp(20),
  },

  firstRowBorderLine: {
    height: 2,
    backgroundColor: colors.gray,
  },

  firstRowItemStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(20),
  },

  imageIconStyle: {
    height: wp(30),
    width: wp(30),
    resizeMode: 'contain',
    tintColor: colors.black,
  },

  itemLabelStyle: {
    fontFamily: fonts.medium,
    fontSize: wp(18),
    color: colors.black,
    marginLeft: 20,
  },

  cityViewStyle: {
    marginHorizontal: wp(20),
  },
});