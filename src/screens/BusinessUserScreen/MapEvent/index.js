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
  Pressable, 
} from 'react-native';
import MapView from "react-native-map-clustering";
import { Marker, PROVIDER_GOOGLE } from "react-native-maps";
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
import { setSelectedCategoryId } from '../../../redux/Slices/FilterCategory';
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
  const dispatch = useDispatch()
  const bottomSheetRef = useRef(null);
  const fitTimeoutRef = useRef(null);   // safe timeout holder
  const [mapReady, setMapReady] = useState(false); // flag when MapView fully mounted

  const { location, error, loading, locationArea, openLocationSettings, getLocation, permissionHandle } = useLocation();

  const filterCategoryId = useSelector(state => state.FilterCategorySlice.selectedCategory);
  const CityMapSlice = useSelector(state => state.CityMapSlice.data)
  const prevCityRef = useRef(CityMapSlice?.city);


  console.log({ CityMapSlice, location })
  useFocusEffect(
    React.useCallback(() => {
      console.log('useFocusEffect')
      const categoryId = filterCategoryId || '';
      const city = CityMapSlice?.city || '';

      // Only fetch + move map when the city actually changed
      if (prevCityRef.current !== city) {
        prevCityRef.current = city;

        setIsLoading(true);
        setShowMapContent(false)
        console.log('**********************hi')

        getDataHandle(categoryId, city);

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
        console.log('**********************hello')
        // Category filter changed → only refresh data, no map jump
        setData([]);
        setFilteredPlaces([]);
        getDataHandle(categoryId, city);
      }
      //  else {
      //   console.log('**********************tummko kya')
      //   setData([]);
      //   setFilteredPlaces([]);
      //   getDataHandle(categoryId, city);
      // }
    }, [filterCategoryId, CityMapSlice?.city, location])
  );

  const getDataHandle = async (categoryId = '', city = '') => {
    if (!location || !location.latitude || !location.longitude) {
      console.log('Skipping API call, location not ready yet');
      return;
    }

    // ✅ STEP 1: Immediately clear previous markers from map
    setData([]);
    setFilteredPlaces([]);
    setShowMapContent(false);

    setIsLoading(true);

    setIsLoading(true);
    let params = '';

    // ✅ If city exists → don't include lat/lon
    if (city) {
      params = `city=${city}`;
    } else {
      const latitude = location?.latitude;
      const longitude = location?.longitude;

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
        // ✅ No data found: ensure map shows no markers
        setData([]);
        setFilteredPlaces([]);
        setShowMapContent(false);

        // ✅ Keep city center visible
        const coords = CityMapSlice?.location_coordinates;
        if (coords) {
          mapRef.current.animateToRegion({
            latitude: coords[0],
            longitude: coords[1],
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
      }
    } catch (err) {
      console.log('Error fetching map data:', err);

      setData([]);
      setFilteredPlaces([]);
      setShowMapContent(false);

      // ✅ Keep city centered if no data found
      if (CityMapSlice?.location_coordinates) {
        const [lat, lng] = CityMapSlice.location_coordinates;
        mapRef.current?.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }

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
      }
    }
  }, [selectedCategories]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (filteredPlaces.length > 0) {
      const coordinates = filteredPlaces.map(p => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
    // ❌ Don’t move map when no places found — keep current city view
  }, [filteredPlaces]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

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
    if (data?.length > 0) {
      setFilteredPlaces(data);
    }
  }, [data, selectedCategories]);

  const toggleCategory = (categoryId) => {
    const isSame = filterCategoryId === categoryId;

    const newId = isSame ? null : categoryId;

    // Redux update
    dispatch(setSelectedCategoryId(newId));

    // API call
    const currentCity = CityMapSlice?.city || '';
    getDataHandle(newId || '', currentCity);
  };

  const goToCurrentLocation = () => {
    if (!location) return;

    // Clear selected city filter
    prevCityRef.current = null;
    dispatch(
      CityMapAction({
        location_title: 'Current Location',
        location_type: 'all',
        location_coordinates: null,
        location_distance: null,
        city: null,
      }),
    );
    // Move map
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    });

    // Fetch near-by places
    const categoryId = filterCategoryId || '';
    getDataHandle(categoryId, '');
  };

  const snapPoints = useMemo(() => [200, '50%'], []);

  return (
    <View style={st.container}>
      <View style={st.searchContainer}>
        <View style={st.searchBox}>
          <Icon name="search" size={20} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Ask about places"
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
            contentContainerStyle={{ paddingStart: 10, marginBottom: 10 }}
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

              return (
                <TouchableOpacity
                  onPress={() => toggleCategory(item._id)}
                  style={[
                    st.filterChip,
                    item._id === filterCategoryId && st.activeChip,
                  ]}>
                  <Text
                    style={[
                      st.errorText,
                      item._id === filterCategoryId && st.activeChipText,
                    ]}>
                    {item.title}
                  </Text>
                  {item._id === filterCategoryId && (
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

      {location && (
        <MapView
          key={filteredPlaces.length}
          ref={mapRef}
          style={st.container}
          customMapStyle={customMapStyle}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          showsCompass={false}
          onMapReady={() => setMapReady(true)}
          isTextureMode={true} 
          useTextureView={true}
          region={{
            latitude:
              CityMapSlice?.location_coordinates?.[0] ||
              location?.latitude ||
              0,
            longitude:
              CityMapSlice?.location_coordinates?.[1] ||
              location?.longitude ||
              0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}>

          {showMapContent && filteredPlaces.length > 0 &&
            filteredPlaces.map((place, index) => {
              const lat = place.latitude;
              const lng = place.longitude;
              if (!lat || !lng) return null; // skip marker if no coordinates

              const imageUri =
                place.source === 'google' && place.photos?.[0]
                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photo_reference=${place.photos[0]}&key=AIzaSyAbFHI5aGGL3YVP0KvD9nDiFKsi_cX3bS0`
                  : place.image?.[0] || place.banner || place.certificate || null;

              return (
                <Marker
                  key={place._id || index}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={place.name}
                  anchor={{ x: 0.5, y: 0.5 }}
                // tracksViewChanges={false}
                >
                  <View style={styles.markerContainer}>
                    <Image source={imageUri ? { uri: imageUri } : ImageConstants.business_logo}
                      style={styles.markerImage}
                      onError={() => console.log('❌ image failed for:', imageUri)}
                    />
                    <Text style={styles.markerText} numberOfLines={1}>
                      {place.name}
                    </Text>
                  </View>
                </Marker>
              );
            })}
        </MapView>
      )}

      <View
        style={{
          position: 'absolute',
          top: 135,
          right: 10,
        }}>
        <TouchableOpacity
          onPress={goToCurrentLocation}
          style={{
            backgroundColor: 'white',
            width: 45,
            height: 45,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
          }}>
          <Icon name="locate" size={22} color="#000" />
        </TouchableOpacity>
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
          data={showMapContent ? filteredPlaces : []}
          keyExtractor={(item, idx) => item.id || item._id || String(idx)}
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
          renderItem={({ item }) => {
            const imageUri = item.image?.[0] || item.banner || item.certificate || null
            return (
              <Pressable style={st.placeItem}
                onPress={() => {
                  navigation.navigate('ClaimBusinessScreen', { ...item,

                    onFollowUpdate: (businessId, isNowFollowing) => {
                      // Update local data immediately
                      console.log('udpate lod', businessId, isNowFollowing)
                      const updateList = (list) =>
                        list.map(p =>
                          (p._id || p.place_id) === businessId
                            ? { ...p, isFollowing: isNowFollowing, total_followers: isNowFollowing ? p.total_followers+1 :p.total_followers-1  }
                            : p
                        );
                      
                      setData(updateList);
                      setFilteredPlaces(updateList);
                      setIsFollowing(false)
                      setIsVisited(false)
                      console.log({updateList})
                    },
                   })
                }} 
              >

                {item.source == 'google' ? (
                  <Base64Image
                    photos={item.photos}
                    maxWidth={400}
                    style={st.placeImage}
                  />
                ) :
                  <Image
                    source={imageUri ? { uri: imageUri } : ImageConstants.business_logo}
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
            )
          }}
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

      
      {/* {isCatLoading &&
        <View style={[st.center]}>
          <ActivityIndicator color={colors.primaryColor} size="large" />
        </View>} */}

      {/* {!showMapContent && (
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: colors.black,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.5
        }]}>
          <ActivityIndicator size="large" color={colors.primaryColor} />
        </View>
      )} */}

    </View>
  );
};

export default ExploreMapScreen;

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center', justifyContent: 'center'
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primaryColor,
    backgroundColor: colors.white,
    resizeMode: 'cover'
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
    featureType: "poi.medical",
    stylers: [{ visibility: "off" }]
  },
];

