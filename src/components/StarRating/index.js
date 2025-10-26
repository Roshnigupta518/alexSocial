import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const StarRating = ({ rating, size = 10, color = '#FFD700' }) => {
  const stars = [];

  // Full stars
  for (let i = 1; i <= Math.floor(rating); i++) {
    stars.push(<Icon key={`full-${i}`} name="star" size={size} color={color} />);
  }

  // Half star
  if (rating % 1 >= 0.5) {
    stars.push(<Icon key="half" name="star-half-full" size={size} color={color} />);
  }

  // Empty stars
  while (stars.length < 5) {
    stars.push(<Icon key={`empty-${stars.length}`} name="star-o" size={size} color={color} />);
  }

  return <View style={{ flexDirection: 'row' }}>{stars}</View>;
};

export default StarRating;
