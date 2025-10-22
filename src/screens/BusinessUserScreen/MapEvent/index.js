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
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet, { useScrollHandlers } from 'react-native-actions-sheet';
import ImageConstants from '../../../constants/ImageConstants';
import { useLocation } from '../../../hooks/MyLocation';
import { getAllBusinessCategoryRequest, getPlacesByMapRequest } from '../../../services/Utills';
import Toast from '../../../constants/Toast';
import { useSelector } from 'react-redux';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import NotFoundAnime from '../../../components/NotFoundAnime'
const ExploreMapScreen = ({ navigation, route }) => {
  // const [location, setLocation] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([])
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState()
  const [isFollowing, setIsFollowing] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  const mapRef = useRef(null);

  const panelRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const { location, error, loading, locationArea, openLocationSettings, getLocation, permissionHandle } = useLocation();
  // console.log({ location })

  const filterCategoryId = useSelector(state => state.FilterCategorySlice.selectedCategory);
  const CityMapSlice = useSelector(state => state.CityMapSlice.data)

  console.log({ CityMapSlice, filterCategoryId })

  useEffect(() => {
    const categoryId = filterCategoryId || '';
    const city = CityMapSlice?.city || '';

    // only call if one of them is present
    // if (categoryId || city) {
      getDataHandle(categoryId, city);
    // }
  }, [filterCategoryId, CityMapSlice]);

  const getDataHandle = async (categoryId = '', city = '') => {
    if (!location || !location.latitude || !location.longitude) {
      console.log('Skipping API call, location not ready yet');
      return;
    }

    setIsLoading(true);
    let params = `latitude=${location.latitude}&longitude=${location.longitude}`;
    // let params = `latitude=27.9199132&longitude=-82.8150127`;
    if (categoryId) params += `&categoryId=${categoryId}`;
    if (city) params += `&city=${city}`;

    try {
      const data = await getPlacesByMapRequest(params);
      if (data?.status) {
        setData(data.result || []);
      } else {
        setData([]);
        console.log('Map API returned false status:', data);
      }
    } catch (err) {
      console.log('Error fetching map data:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };


  const getCategories = () => {
    setIsLoading(true);
    getAllBusinessCategoryRequest()
      .then(res => {
        console.log({ res })
        setCategories(res?.result);
      })
      .catch(err => {
        Toast.error('Business Categories', err?.message);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getCategories();

    if (location && location.latitude && location.longitude) {
      getDataHandle();
    }
  }, [location]);


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
    if (!mapRef.current || data.length === 0) return;

    // Convert and filter valid coordinates
    const coordinates = data
      .map(p => {
        const lat = Number(p.latitude);
        const lng = Number(p.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          return { latitude: lat, longitude: lng };
        }
        return null;
      })
      .filter(Boolean);

    if (coordinates.length === 0) return;

    // Delay fitToCoordinates slightly to ensure map renders first
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }, 500);
  }, [data]);

  useEffect(() => {
    if (!mapRef.current || filteredPlaces.length === 0) return;

    const coordinates = filteredPlaces.map(p => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [filteredPlaces]);

  useEffect(() => {
    let places = [...data];

    if (selectedCategories.length > 0) {
      places = places.filter(p =>
        selectedCategories.includes(
          typeof p.category === 'object' ? p.category?._id : p.category
        )
      );
    }

    if (search && search.trim().length > 0) {
      const query = search.trim().toLowerCase();
      places = places.filter(p =>
        p.name?.toLowerCase().includes(query)
      );
    }

    if (isFollowing) {
      places = places.filter(p => p.isFollowing === true);
    }

    if (isVisited) {
      places = places.filter(p => p.isVisited === true);
    }

    setFilteredPlaces(places);
  }, [data, selectedCategories, search, isFollowing, isVisited]);

  const toggleCategory = categoryId => {
    setSelectedCategories(prev => {
      // if same category clicked again, clear selection
      const isSame = prev[0] === categoryId;
      const updated = isSame ? [] : [categoryId];

      // fetch data again with new category filter
      getDataHandle(isSame ? '' : categoryId);

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
            latitude: location.latitude,
            longitude: location.longitude,
            // latitude: 27.9199132,
            // longitude: -82.8150127, // ✅ fixed negative longitude
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>
          {filteredPlaces.map(place => (
            <Marker
              key={place.id}
              coordinate={{
                latitude: Number(place.latitude),
                longitude: Number(place.longitude),
              }}
              title={place.name}>
              <View style={styles.markerContainer}>
                <Image
                  source={{ uri: place.image?.[0] || place.banner || place.certificate }}
                  style={styles.markerImage}
                />
                <Text style={styles.markerText} numberOfLines={1} >{place.name}</Text>
              </View>
            </Marker>

          ))}

        </MapView>
      )}

      <View style={st.searchContainer}>
        <View style={st.searchBox}>
          <Icon name="search" size={20} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Ask Tibbs about places and people"
            placeholderTextColor="#999"
            style={st.errorText}
            value={search}
            onChangeText={setSearch}
          />
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

              const isSelected = selectedCategories.includes(item._id);
              return (
                <TouchableOpacity
                  onPress={() => toggleCategory(item._id)}
                  style={[
                    st.filterChip,
                    isSelected && st.activeChip,
                  ]}>
                  <Text
                    style={[
                      st.errorText,
                      isSelected && st.activeChipText,
                    ]}>
                    {item.title}
                  </Text>
                  {isSelected && (
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
          data={filteredPlaces}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 10 }}
          ListHeaderComponent={() => (
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


          )}
          renderItem={({ item }) => (

            <Pressable style={st.placeItem} onPress={() => {
              navigation.navigate('ClaimBusinessScreen', { ...item })
            }} >
              <Image
                source={{ uri: item.image?.[0] || item.banner || item.certificate }}
                style={st.placeImage}
              />
              <View style={st.placeInfo}>
                <Text style={st.errorText}>{item.name}</Text>
                <View style={st.ratingRow}>
                  <Text style={st.ratingText}>Followers: {item.total_followers}</Text>
                  <Text style={st.ratingText}>Likes: {item.total_likes}</Text>

                </View>
              </View>
              {/* <TouchableOpacity>
                     <Icon name="bookmark-outline" size={20} color="#fff" />
                   </TouchableOpacity> */}
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


    </View>
  );
};

export default ExploreMapScreen;

const styles = StyleSheet.create({
  markerContainer: {
  },
  markerImage: {
    width: 30,
    height: 30,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primaryColor,
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


