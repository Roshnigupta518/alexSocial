import React, { useState } from 'react';
import { Image } from 'react-native';
import ImageConstants from '../../constants/ImageConstants';

const Avatar = ({ uri, style }) => {
  const [error, setError] = useState(false);

  return (
    <Image
      source={
        !error && uri
          ? { uri }
          : ImageConstants.user 
      }
      style={style}
      onError={() => setError(true)}
    />
  );
};

export default Avatar;
