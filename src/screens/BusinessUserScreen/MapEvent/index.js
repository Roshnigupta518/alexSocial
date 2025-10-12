
import React, { useEffect, useState, useRef } from 'react';
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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet, { useScrollHandlers } from 'react-native-actions-sheet';
import ImageConstants from '../../../constants/ImageConstants';

const ExploreMapScreen = ({navigation}) => {
  const [location, setLocation] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const actionSheetRef = useRef(null);
  const mapRef = useRef(null);


  const categories = ['Food & Drink', 'Hotels', 'Parks', 'Shops', 'Events'];

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) getLocation();
      } else getLocation();
    };
    const getLocation = () => {
      Geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          setLocation({ latitude, longitude });
        },
        err => console.log(err),
      );
    };

    requestPermission();
  }, []);


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
        latitude: place.latitude ,
        longitude: place.longitude ,
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {top: 80, right: 80, bottom: 80, left: 80},
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

  
  const filteredPlaces =
    selectedCategories.length > 0
      ? dummyPlaces.filter(p => selectedCategories.includes(p.category))
      : [];

  // Toggle category selection
  const toggleCategory = category => {
    setSelectedCategories(prev => {
      const exists = prev.includes(category);
      const updated = exists
        ? prev.filter(item => item !== category)
        : [...prev, category];
      if (updated.length > 0) {
        actionSheetRef.current?.show();
      } else {
        actionSheetRef.current?.hide();
      }
      return updated;
    });
  };

  const scrollHandlers = useScrollHandlers('scroll', actionSheetRef);

  return (
    <View style={st.container}>
      {/* Map */}
      {location && (
        <MapView
          ref={mapRef}
          style={st.container}
          // provider={PROVIDER_GOOGLE}
          showsUserLocation
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>
          {filteredPlaces.map(place => (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              title={place.name}>
              <View style={styles.markerContainer}>
                <Image
                  source={{ uri: place.image }}
                  // source={require('../../../assets/images/appIcon.png')}
                  style={styles.markerImage}
                />
                <Text style={styles.markerText}>{place.name}</Text>
              </View>
            </Marker>
          ))}

        </MapView>
      )}

      {/* Search Bar */}
      <View style={st.searchContainer}>
        <View style={st.searchBox}>
          <Icon name="search" size={20} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Ask Tibbs about places and people"
            placeholderTextColor="#999"
            style={{ flex: 1, fontSize: 15 }}
          />
        </View>

        {/* Filter Chips */}
        <View style={st.filterRow}>
          <FlatList
            data={['__location__', ...categories]} // 👈 prepend location chip
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            contentContainerStyle={{paddingStart:10}}
            renderItem={({ item }) => {
              if (item === '__location__') {
                // 👇 location chip
                return (
                  <View style={st.row}>
                    <TouchableOpacity style={[st.filterChipSt, {marginLeft:0}]} 
                    onPress={()=>navigation.navigate('CategoriesFilter')}>
                      <Icon name='options-outline' size={20} color={colors.white} />
                    </TouchableOpacity>
                  <TouchableOpacity style={st.locationFilter} onPress={()=>navigation.navigate('SearchCity')} >
                    <Icon name="location-outline" size={18} color="#000" />
                    <Text style={st.filterText}>Huzur Tehsil</Text>
                    <Icon name="chevron-down" size={16} color="#000" />
                  </TouchableOpacity>
                
                  </View>
                );
              }

              const isSelected = selectedCategories.includes(item);
              return (
                <TouchableOpacity
                  onPress={() => toggleCategory(item)}
                  style={[
                    st.filterChip,
                    isSelected && st.activeChip,
                  ]}>
                  <Text
                    style={[
                      st.errorText,
                      isSelected && st.activeChipText,
                    ]}>
                    {item}
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

      {/* Bottom Sheet */}
      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled
        containerStyle={{
          backgroundColor: '#111',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}
        indicatorStyle={{ backgroundColor: '#444' }}>
        <View>
          <View style={st.row}>
            <View style={st.filterChipSt}>
              <Text style={[st.errorText]}>
                Following
              </Text>
            </View>
            <View style={st.filterChipSt}>
              <Text style={[st.errorText]}>
                My Visits
              </Text>
            </View>
          </View>
          <Text style={[st.errorText, { marginLeft: 15 }]}>
            {filteredPlaces.length} places
          </Text>

          <FlatList
            data={filteredPlaces}
            {...scrollHandlers}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 15,
            }}
            renderItem={({ item }) => (
              <View style={st.placeItem}>
                <Image source={{ uri: item.image }} style={st.placeImage} />
                <View style={st.placeInfo}>
                  <Text style={st.errorText}>{item.name}</Text>
                  <View style={st.ratingRow}>
                    <Icon name="star" size={12} color="#FFD700" />
                    <Text style={[st.ratingText,]}>{item.rating}</Text>
                  </View>
                  <Text style={st.errorText}>
                    📷 {item.views}+ location views
                  </Text>
                </View>
                <TouchableOpacity>
                  <Icon name="bookmark-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </ActionSheet>
    </View>
  );
};

export default ExploreMapScreen;

const styles = StyleSheet.create({
  markerContainer: {
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  markerImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: colors.primaryColor,
    // backgroundColor: colors.primaryColor
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
  },
});


const dummyPlaces = [
  {
    id: '1',
    name: 'Mehfil-e-Punjab Restaurant',
    category: 'Food & Drink',
    rating: 4.5,
    views: 200,
    image:
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=400&q=60',
    latitude: 28.6139,
    longitude: 77.2090,
  },
  {
    id: '2',
    name: 'Ras Raj Restaurant',
    category: 'Food & Drink',
    rating: 3.8,
    views: 120,
    image:
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=400&q=60',
    latitude: 19.0760,
    longitude: 72.8777,
  },
  {
    id: '3',
    name: 'Indian Coffee House',
    category: 'Food & Drink',
    rating: 3.5,
    views: 350,
    image:
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=400&q=60',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    id: '4',
    name: 'Green Park',
    category: 'Parks',
    rating: 4.2,
    views: 80,
    image:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=60',
    latitude: 28.5494,
    longitude: 77.2001,

  },
];
