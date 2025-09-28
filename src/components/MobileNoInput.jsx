import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {colors, fonts, WIDTH, wp, hp} from '../constants';
import {CountryPicker} from 'react-native-country-codes-picker';
import ImageConstants from '../constants/ImageConstants';

const MobileNoInput = ({
  label = '',
  placeholder = label,
  value = '',
  maxLength = 15,
  onTextChange = txt => {},
  onCountryChange = code => {},
  callingCode = '',
}) => {
  const [countryCode, setCountryCode] = useState('');
  const [country, setCountry] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [countryPickerKey, setCountryPickerKey] = useState(0);

    // 🔥 Sync prop to local state
    useEffect(() => {
      if (callingCode) {
        setCountryCode(callingCode);
      }
    }, [callingCode]);

  const onSelect = country => {
    setCountryCode(country?.dial_code);
    setIsModalVisible(false);
    setCountry(country);
    onCountryChange(country?.dial_code);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.labelStyle}>{label}</Text>

      <View style={styles.inputConatiner}>
        <View>
          <CountryPicker
            show={isModalVisible}
            key={countryPickerKey}
            pickerButtonOnPress={item => onSelect(item)}
            inputPlaceholder={'Select Code'}
            inputPlaceholderTextColor={'#838383'}
            searchMessage={'Search Country'}
            onRequestClose={() => setIsModalVisible(false)}
            onBackdropPress={() => setIsModalVisible(false)}
            style={{
              modal: {
                maxHeight: 450,
              },
              flatListContainer: {
                paddingTop: 10,
              },
              textInput: {
                height: 45,
                fontFamily: fonts.medium,
                color: colors.black,
              },
              dialCode: {
                fontFamily: fonts.medium,
                color: colors.black,
                marginRight: 8,
                flexShrink: 0, // Don't shrink dial code
              },
              countryName: {
                fontFamily: fonts.medium,
  color: colors.black,
  flexShrink: 1,           // Allows it to shrink if needed
  flexGrow: 1,             // Allows it to grow and fill space
  flexBasis: 'auto',       // Respects content size
  minWidth: 0,
              },
              countryButtonStyles: {
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                width: '100%',
              }
            }}
            androidWindowSoftInputMode={'pan'}
          />
          <TouchableOpacity
            style={styles.callingCodeStyle}
            // onPress={() => setIsModalVisible(true)}
            onPress={() => {
              setCountryPickerKey(prev => prev + 1);
              setIsModalVisible(true);
            }}
            >
            <Text style={styles.callingTxtStyle}>
              {countryCode === '' ? 'Select Code' : countryCode}
            </Text>

            <Image
              source={ImageConstants.downArrow}
              style={styles.downArrowStyle}
            />
          </TouchableOpacity>
        </View>

        <Image source={ImageConstants.verLine} style={{width: 1,marginHorizontal: 5}} />
        <TextInput
          style={styles.inputStyle}
          keyboardType={'number-pad'}
          textContentType="telephoneNumber"
          placeholder={placeholder}
          placeholderTextColor={colors.black}
          value={value}
          maxLength={maxLength}
          onChangeText={onTextChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.borderGrayColor,
    borderRadius: 5,
  },

  labelStyle: {
    position: 'absolute',
    top: -10,
    left: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    fontFamily: fonts.medium,
    fontSize: wp(12),
  },

  inputConatiner: {
    marginTop: wp(5),
    marginHorizontal: wp(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inputStyle: {
    flex: 1,
    paddingVertical: wp(10),
    marginTop: 4,
    fontSize: wp(14),
    paddingHorizontal: wp(10),
    fontFamily: fonts.medium,
  },

  eyeContainer: {
    marginHorizontal: wp(5),
  },

  eyeImageStyle: {
    height: wp(30),
    width: wp(30),
    resizeMode: 'contain',
  },

  callingCodeStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: WIDTH / 5,
    justifyContent: 'center',
  },

  callingTxtStyle: {
    fontFamily: fonts.medium,
    fontSize: wp(12),
    color: colors.black,
  },

  downArrowStyle: {
    marginLeft: wp(10),
    width: wp(12),
  height: wp(12),
  resizeMode: 'contain',
  },
});

export default MobileNoInput;
