import React from 'react';
import { View, Image, FlatList, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants';
// 🔑 Reusable Google Photo Component
const GooglePlaceImage = ({ photos = [], maxWidth = 30, style }) => {
  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.noPhotoContainer, style]}>
        <Text style={styles.noPhotoText}>No photo available</Text>
      </View>
    );
  }

const getPhotoUrl = (photoRef) => {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=AIzaSyAbFHI5aGGL3YVP0KvD9nDiFKsi_cX3bS0`;
    // console.log('📸 Google Image URL:', url); // <-- ✅ Logs each image URL
    return url;
  };

  // If single photo → show just one image
  if (photos.length === 1) {
    return (
      <Image
        source={{ uri: getPhotoUrl(photos[0]) }}
        style={[styles.image, style]}
        resizeMode="cover"
        
      />
    );
  }

  // If multiple photos → show horizontally scrollable list
  return (
    <FlatList
      data={photos}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => {
        return(
        <Image
          source={{ uri: getPhotoUrl(item) }}
          style={[styles.image, style]}
          resizeMode="cover"
        />
    )
    }
      }
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: 30,
    height: 30,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primaryColor,
  },
  noPhotoContainer: {
    width: 250,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    color: '#999',
    fontSize: 14,
  },
});

export default GooglePlaceImage;
