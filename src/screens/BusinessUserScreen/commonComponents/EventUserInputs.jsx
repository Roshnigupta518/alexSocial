import React, {useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {colors, fonts, HEIGHT, wp} from '../../../constants';
import MediaPickerSheet from '../../../components/EventMediaPickerSheet';
import ImageConstants from '../../../constants/ImageConstants';

const BusinessUserInputs = ({
  theme = 'dark',
  value = '',
  onChangeText = txt => {},
  label = '',
  placeholder = '',
  keyboardType = 'default',
  maxlenght = 0,
}) => {
  return (
    <View>
      <Text style={styles.labelStyle}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme == 'dark' ? colors.white : colors.black}
        value={value}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        style={styles.inputStyle(theme)}
        maxLength={maxlenght > 0 ? maxlenght : 255}
      />
    </View>
  );
};

const BusinessUserDescriptionInput = ({
  theme = 'dark',
  value = '',
  onChangeText = txt => {},
  label = '',
  placeholder = '',
}) => {
  return (
    <View>
      <Text style={styles.labelStyle}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        multiline={true}
        placeholderTextColor={theme == 'dark' ? colors.white : colors.black}
        value={value}
        onChangeText={onChangeText}
        style={styles.inputDescStyle(theme)}
      />
    </View>
  );
};

const BusinessImagePicker = ({
  extraImage = '',
  label = '',
  theme = 'dark',
  image = [],
  multiple = false,
  getImageFile = () => {},
  onRemoveImage = () => {},
  mediaType = 'photo',
  disabled,
  hidePlus = false
}) => {
  const mediaRef = useRef();

  console.log({image})

  return (
    <View>
      <Text style={styles.labelStyle}>{label}</Text>

      <View
        style={{
          backgroundColor:
            theme === 'dark' ? colors.black : colors.lightPrimaryColor,
          padding: wp(10),
          borderRadius: 5,
          marginTop: wp(7),
          marginBottom: wp(13),
        }}>

        {/* IMAGES GRID */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Array.isArray(image) &&
            image.map((img, index) => (
              <View key={index} style={{ marginRight: wp(8), marginBottom: wp(8) }}>
                <Image
                  source={{ uri: typeof img === 'string'
                    ? img: img.uri }}
                  style={{
                    height: wp(60),
                    width: wp(60),
                    borderRadius: 10,
                  }}
                />

                {/* CLOSE ICON */}
                {!disabled&&
                <TouchableOpacity
                  onPress={() => onRemoveImage(index)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: colors.black,
                    borderRadius: 12,
                    padding: 3,
                  }}>
                  <Text style={{ color: colors.white, fontSize: wp(10) }}>✕</Text>
                </TouchableOpacity>}
              </View>
            ))}

          {/* PLUS BUTTON */}
          {!(disabled || hidePlus)&&
          <TouchableOpacity
            onPress={() => mediaRef.current?.open()}
            activeOpacity={0.8}
            style={{
              height: wp(60),
              width: wp(60),
              borderRadius: 10,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme === 'dark' ? colors.white : colors.black,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                backgroundColor: colors.primaryColor,
                borderRadius: 30,
                padding: 6,
              }}>
              <Image
                source={ImageConstants.plus}
                style={{
                  height: wp(15),
                  width: wp(15),
                  tintColor: colors.black,
                }}
              />
            </View>
          </TouchableOpacity>
           }
        </View>
      </View>

      <MediaPickerSheet
        ref={mediaRef}
        multiple={multiple}
        mediaType={mediaType}
        onMediaClick={res => getImageFile(res)}
        onCameraClick={res => getImageFile(res)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  labelStyle: {
    fontFamily: fonts.medium,
    fontSize: wp(14),
    color: colors.black,
  },

  inputStyle: theme => {
    return {
      backgroundColor:
        theme == 'dark' ? colors.black : colors.lightPrimaryColor,
      paddingVertical: wp(15),
      paddingHorizontal: wp(10),
      color: theme == 'dark' ? colors.white : colors.black,
      borderRadius: 5,
      marginTop: 7,
      marginBottom: wp(13),
    };
  },

  inputDescStyle: theme => {
    return {
      backgroundColor:
        theme == 'dark' ? colors.black : colors.lightPrimaryColor,
      paddingVertical: wp(15),
      paddingHorizontal: wp(10),
      color: theme == 'dark' ? colors.white : colors.black,
      borderRadius: 5,
      marginTop: 7,
      marginBottom: wp(13),
      height: wp(100),
      textAlignVertical: 'top',
    };
  },
});

export {BusinessUserInputs, BusinessUserDescriptionInput, BusinessImagePicker};
