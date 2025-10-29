import React, { useEffect, useState, useRef, useMemo } from 'react';
import { colors, HEIGHT, wp } from '../../../constants';
import st from '../../../global/styles';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Pressable
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageConstants from '../../../constants/ImageConstants';
import { useLocation } from '../../../hooks/MyLocation';
import { getAllBusinessCategoryRequest, getPlacesByMapRequest } from '../../../services/Utills';
import Toast from '../../../constants/Toast';
import { useSelector, useDispatch } from 'react-redux';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import Base64Image from '../../../components/Base64Image';
import StarRating from '../../../components/StarRating';
import { useFocusEffect } from '@react-navigation/native';
import { CityMapAction } from '../../../redux/Slices/CityMapSlice';

const ExploreMapScreen = ({ navigation, route }) => {
  const [selectedCategories, setSelectedCategories] = useState();
  const [categories, setCategories] = useState([])
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState()
  const [isFollowing, setIsFollowing] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [isCatLoading, setIsCatLoading] = useState(false)
  const [showMapContent, setShowMapContent] = useState(true);


  const mapRef = useRef(null);
  const prevCityRef = useRef(CityMapSlice?.city);
  const dispatch = useDispatch()
  const bottomSheetRef = useRef(null);
  const { location, error, loading, locationArea, openLocationSettings, getLocation, permissionHandle } = useLocation();

  const filterCategoryId = useSelector(state => state.FilterCategorySlice.selectedCategory);
  const CityMapSlice = useSelector(state => state.CityMapSlice.data)
  console.log({ CityMapSlice })
  useFocusEffect(
    React.useCallback(() => {
      const categoryId = filterCategoryId || '';
      const city = CityMapSlice?.city || '';

      // Only fetch + move map when the city actually changed
      if (prevCityRef.current !== city) {
        prevCityRef.current = city;

        // ✅ clear old data instantly to avoid flicker
        // setData([]);
        // setFilteredPlaces([]);
        setIsLoading(true);
        setShowMapContent(false)

        getDataHandle(categoryId, city);

        // Optional smooth move to new city
        setTimeout(() => {
          if (mapRef.current && location) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            });
          }
        }, 400);
      } else if (filterCategoryId) {
        // Category filter changed → only refresh data, no map jump
        getDataHandle(categoryId, city);
      } else {
        getDataHandle(categoryId, city);
      }
    }, [filterCategoryId, CityMapSlice?.city])
  );

  const getDataHandle = async (categoryId = '', city = '') => {
    if (!location || !location.latitude || !location.longitude) {
      console.log('Skipping API call, location not ready yet');
      return;
    }

    setIsLoading(true);
    let params = '';

    // ✅ If city exists → don't include lat/lon
    if (city) {
      params = `city=${city}`;
    } else {
      const latitude = location?.latitude;
      const longitude = location?.longitude;
      // const latitude = 27.9199132;
      // const longitude = -82.8150127;

      params = `latitude=${latitude}&longitude=${longitude}`;
    }

    if (categoryId) params += `&categoryId=${categoryId}`;

    try {
      const data = await getPlacesByMapRequest(params);
      if (data?.status) {
        console.log({ data: data.result })
        // setData(data.result || []);
        const normalizedData = data.result.map(p => ({
          ...p,
          latitude: p.source === 'google' && p.loc?.coordinates?.length === 2
            ? Number(p.loc.coordinates[1])
            : Number(p.latitude),
          longitude: p.source === 'google' && p.loc?.coordinates?.length === 2
            ? Number(p.loc.coordinates[0])
            : Number(p.longitude),
        }));
        console.log({ normalizedData })
        setData(normalizedData || []);
        setTimeout(() => {
          setShowMapContent(true); // 👈 reveal after data updated
          setIsLoading(false);
        }, 300);
      } else {
        setData([]);
        console.log('Map API returned false status:', data);
      }
    } catch (err) {
      console.log('Error fetching map data:', err);
      setData([]);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 600)
    }
  };

  const getCategories = () => {
    setIsCatLoading(true);
    getAllBusinessCategoryRequest()
      .then(res => {
        console.log({ res })
        setCategories(res?.result);
      })
      .catch(err => {
        Toast.error('Business Categories', err?.message);
      })
      .finally(() => setIsCatLoading(false));
  };

  useEffect(() => {
    getCategories();
  }, []);

  useEffect(() => {
    if (!location || !location.latitude || !location.longitude) return;

    const city = CityMapSlice?.city || '';
    const categoryId = filterCategoryId || '';

    // if city already handled in useFocusEffect → skip duplicate call
    if (prevCityRef.current === city) {
      getDataHandle(categoryId, city);
    }
  }, [filterCategoryId, location]);

  useEffect(() => {
    if (mapRef.current) {
      if (filteredPlaces.length > 0) {
        const avgLat =
          filteredPlaces.reduce((sum, p) => sum + p.latitude, 0) /
          filteredPlaces.length;
        const avgLng =
          filteredPlaces.reduce((sum, p) => sum + p.longitude, 0) /
          filteredPlaces.length;

        mapRef.current.animateToRegion(
          {
            latitude: avgLat,
            longitude: avgLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000,
        );
      } else if (location) {
        // Reset to user location
        mapRef.current.animateToRegion(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000,
        );
      }
    }
  }, [selectedCategories]);

  useEffect(() => {
    if (filteredPlaces.length > 0 && mapRef.current) {
      const coordinates = filteredPlaces.map(place => ({
        latitude: place.latitude,
        longitude: place.longitude,
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    } else if (location && mapRef.current) {
      // reset back to current user location
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [filteredPlaces]);

  useEffect(() => {
    if (!mapRef.current || filteredPlaces.length === 0) return;

    const coordinates = filteredPlaces.map(p => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));

    if (coordinates.length > 0) {
      clearTimeout(mapRef.current._fitTimeout);
      mapRef.current._fitTimeout = setTimeout(() => {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
      }, 300);
    }
  }, [filteredPlaces]);


  useEffect(() => {
    setFilteredPlaces([]);
    let places = [...data];

    if (selectedCategories) {
      places = places.filter(p =>
        p.category_id == selectedCategories
      );
    }

    if (search && search.trim().length > 0) {
      const query = search.trim().toLowerCase();
      places = places.filter(p => {
        const name = p.name || p.title || '';
        return name.toLowerCase().includes(query);
      });
    }

    if (isFollowing) {
      places = places.filter(p => p.isFollowing === true);
    }

    if (isVisited) {
      places = places.filter(p => p.isVisited === true);
    }

    setFilteredPlaces(places);

    console.log({ places })
  }, [data, selectedCategories, search, isFollowing, isVisited]);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.animateToRegion({
      latitude: filteredPlaces[0]?.latitude || location.latitude,
      longitude: filteredPlaces[0]?.longitude || location.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }, 500);
  }, [filteredPlaces]);


  const toggleCategory = categoryId => {
    setSelectedCategories(prev => {
      const isSame = prev === categoryId;
      const updated = isSame ? '' : categoryId;

      // ✅ Always include the active city in the API call
      const currentCity = CityMapSlice?.city || '';
      getDataHandle(isSame ? '' : categoryId, currentCity);

      return updated;
    });
  };

  const snapPoints = useMemo(() => [200, '50%'], []);

  return (
    <View style={st.container}>
      {location && (
        <MapView
          ref={mapRef}
          style={st.container}
          customMapStyle={customMapStyle}
          showsUserLocation
          region={{
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>

          {showMapContent && filteredPlaces.map(place => {
            const lat = place.latitude;
            const lng = place.longitude;
            if (!lat || !lng) return null; // skip marker if no coordinates

            const imageUri =
              place.source === 'google' && place.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photo_reference=${place.photos[0]}&key=AIzaSyAbFHI5aGGL3YVP0KvD9nDiFKsi_cX3bS0`
                : place.image?.[0] || place.banner || place.certificate || null;

            return (
              <Marker
                // key={place.id}
                key={`${place.id}-${search || ''}-${selectedCategories || ''}-${isFollowing}-${isVisited}`}
                coordinate={{ latitude: lat, longitude: lng }}
                title={place.name}
                anchor={{ x: 0.5, y: 0.5 }}
              // tracksViewChanges={false} 
              >
                {imageUri && (
                  <View style={styles.markerContainer}>
                    <Image source={imageUri ? { uri: imageUri } : ImageConstants.business_logo}
                      style={styles.markerImage}
                      resizeMode='cover'
                      onError={() => console.log('❌ image failed for:', imageUri)}
                    />
                    <Text style={styles.markerText} numberOfLines={1}>
                      {place.name}
                    </Text>
                  </View>
                )}
              </Marker>
            );
          })}


        </MapView>
      )}

      <View style={st.searchContainer}>
        <View style={st.searchBox}>
          <Icon name="search" size={20} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Ask Tibbs about places and people"
            placeholderTextColor="#999"
            style={[st.errorText, { width: '85%' }]}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={{ position: 'absolute', right: 0 }} onPress={() => setSearch('')} >
            <Icon name="close" size={20} color="#666" style={{ marginRight: 8 }} />
          </TouchableOpacity>
        </View>

        <View style={st.filterRow}>
          <FlatList
            data={['__location__', ...categories]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => (item === '__location__' ? '__location__' : item._id)}
            contentContainerStyle={{ paddingStart: 10 }}
            renderItem={({ item }) => {
              if (item === '__location__') {
                // 👇 location chip
                return (
                  <View style={st.row}>
                    <TouchableOpacity style={[st.filterChipSt, { marginLeft: 0 }]}
                      onPress={() => navigation.navigate('CategoriesFilter')}>
                      <Icon name='options-outline' size={20} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={st.locationFilter} onPress={() => navigation.navigate('SearchCity')} >
                      <Icon name="location-outline" size={18} color="#000" />
                      <Text style={st.filterText}>{CityMapSlice?.location_title}</Text>
                      <Icon name="chevron-down" size={16} color="#000" />
                    </TouchableOpacity>

                  </View>
                );
              }

              // const isSelected = selectedCategories.includes(item._id);
              return (
                <TouchableOpacity
                  onPress={() => toggleCategory(item._id)}
                  style={[
                    st.filterChip,
                    item._id === selectedCategories && st.activeChip,
                  ]}>
                  <Text
                    style={[
                      st.errorText,
                      item._id === selectedCategories && st.activeChipText,
                    ]}>
                    {item.title}
                  </Text>
                  {item._id === selectedCategories && (
                    <Icon
                      name="close"
                      size={14}
                      color={colors.black}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>


      {/* ✅ NEW BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: '#000' }}
        handleIndicatorStyle={{ backgroundColor: '#888' }}
      >
        <BottomSheetFlatList
          // data={filteredPlaces}
          data={showMapContent ? filteredPlaces : []}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 10 }}
          ListHeaderComponent={() => (
            <View>
              <View style={st.row}>
                <TouchableOpacity
                  style={[st.filterChipSt, isFollowing && st.activeChip]}
                  onPress={() => setIsFollowing(prev => !prev)}>
                  <Text style={[st.errorText, isFollowing && st.activeChipText]}>
                    Following
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[st.filterChipSt, isVisited && st.activeChip]}
                  onPress={() => setIsVisited(prev => !prev)}>
                  <Text style={[st.errorText, isVisited && st.activeChipText]}>
                    My Visits
                  </Text>
                </TouchableOpacity>
              </View>
              {!isLoading &&
                <Text style={[st.errorText]}>     {filteredPlaces?.length} Places</Text>
              }
            </View>


          )}
          renderItem={({ item }) => (

            <Pressable style={st.placeItem} onPress={() => {
              navigation.navigate('ClaimBusinessScreen', { ...item })
            }} >

              {item.source == 'google' ? (
                <Base64Image
                  photos={item.photos}
                  maxWidth={400}
                  style={st.placeImage}
                />
              ) :
                <Image
                  source={{ uri: item.image?.[0] || item.banner || item.certificate }}
                  style={st.placeImage}
                />
              }

              <View style={st.placeInfo}>
                <Text style={st.errorText}>{item.name}</Text>
                <View style={st.ratingRow}>
                  <Text style={st.ratingText}>Followers: {item.total_followers}</Text>
                  <Text style={st.ratingText}>Likes: {item.total_likes}</Text>

                </View>
                {item.rating &&
                  <View style={{ marginLeft: 3 }}>
                    <StarRating rating={item.rating} />
                  </View>
                }
              </View>
            </Pressable>
          )}
          ListEmptyComponent={() => {
            if (isLoading) {
              return (
                <View style={[st.center, { flex: 1, paddingVertical: 40 }]}>
                  <ActivityIndicator color={colors.primaryColor} size="large" />
                </View>
              );
            }
            return (
              <View style={[st.center, { flex: 1, paddingVertical: 40 }]}>
                <Text style={[st.errorText, { color: colors.white, fontSize: 16 }]}>
                  No data found
                </Text>
              </View>
            );
          }}
        />

      </BottomSheet>
      {isCatLoading &&
        <View style={[st.center]}>
          <ActivityIndicator color={colors.primaryColor} size="large" />
        </View>}

      {!showMapContent && (
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: colors.black,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.5
        }]}>
          <ActivityIndicator size="large" color={colors.primaryColor} />
        </View>
      )}

    </View>
  );
};

export default ExploreMapScreen;

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center', justifyContent: 'center'
  },
  markerImage: {
    width: 30,
    height: 30,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primaryColor,
    backgroundColor: colors.white
  },
  markerLabel: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  markerText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    width: 100
  },
});

const customMapStyle = [
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];
