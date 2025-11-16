import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants';

const ReadMoreText = ({ text, numberOfLines = 2 }) => {
  const [isTruncated, setIsTruncated] = useState(true);
  const [shouldShowMore, setShouldShowMore] = useState(false);

  const handleTextLayout = (e) => {
    const lineCount = e.nativeEvent.lines.length;

    if (lineCount > numberOfLines) {
      setShouldShowMore(true);
    }
  };

  return (
    <View style={{marginBottom:5}}>
      {/* STEP 1 → Hidden full text to measure lines */}
      {!shouldShowMore && (
        <Text
          style={{ position: 'absolute', opacity: 0 }}
          onTextLayout={handleTextLayout}
        >
          {text}
        </Text>
      )}

      {/* STEP 2 → Actual visible text */}
      <Text numberOfLines={isTruncated ? numberOfLines : undefined}>
        {text}
      </Text>

      {/* Show button only if needed */}
      {shouldShowMore && (
        <TouchableOpacity onPress={() => setIsTruncated(!isTruncated)}>
          <Text
            style={{
              color: colors.primaryColor,
              marginTop: 5,
              fontWeight: '600',
            }}
          >
            {isTruncated ? 'See More' : 'See Less'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ReadMoreText;
