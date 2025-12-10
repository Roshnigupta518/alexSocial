// components/ImageWithFallback.js
import React, { useState } from 'react';
import { Image, View } from 'react-native';
import ImageConstants from '../../constants/ImageConstants';

const ImageWithFallback = ({ imageUri, style }) => {
  const [error, setError] = useState(false);

  // अगर imageUri ही नहीं है या error आया → default logo
  if (!imageUri || error) {
    return (
      <Image
        source={ImageConstants.business_logo}
        style={style}
        resizeMode="cover"
      />
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      resizeMode="cover"
      onError={(e) => {
        console.log('Image load failed:', imageUri);
        setError(true);
      }}
      // ये बहुत ज़रूरी है Google photos के लिए!
      defaultSource={ImageConstants.business_logo}
    />
  );
};

export default React.memo(ImageWithFallback);