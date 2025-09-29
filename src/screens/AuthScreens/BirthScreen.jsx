import React, {useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  StyleSheet, TouchableOpacity
} from 'react-native';
import {colors, fonts, WIDTH, wp} from '../../constants';
import ImageConstants from '../../constants/ImageConstants';
// import DatePicker from 'react-native-date-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomButton from '../../components/CustomButton';
import BackHeader from '../../components/BackHeader';
import moment from 'moment';
import CustomContainer from '../../components/container';
import st from '../../global/styles';

const BirthScreen = ({navigation}) => {
  const temp_year = new Date().getFullYear();
  var tempDate = new Date(temp_year, 11, 30);
  const minDate = new Date(1900, 1, 1);
  tempDate.setFullYear(tempDate.getFullYear() - 18);
  const [date, setDate] = useState();
  const [isPickerVisible, setPickerVisible] = useState(false);

  const showPicker = () => setPickerVisible(true);
const hidePicker = () => setPickerVisible(false);

const handleConfirm = (selectedDate) => {
setDate(selectedDate);
hidePicker();
};

  return (
    <CustomContainer>
      <BackHeader />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.birthdayTxtStyle}>When Is Your Birthday?</Text>

        <Text style={styles.subTxtStyle}>
          This information will allow you to receive special offers from
          <Text style={styles.subTxtAlexStyle}>{' ALEX '}</Text>
          partners. Your information is kept private. The partners themselves do
          not receive any of your information. This information is also used for
          account verification purposes.
        </Text>

        <Image source={ImageConstants.celebrate} />

        {/* <DatePicker
          date={date}
          mode="date"
          maximumDate={tempDate}
          minimumDate={minDate}
          theme={'light'}
          onDateChange={setDate}
        /> */}

<View style={{marginVertical: 20, width: WIDTH - 60}}>
  {/* <CustomButton label="Select Birthday" onPress={showPicker} /> */}
  <View >
              <Text style={st.labelStyle}>Select Birthday:</Text>
              <TouchableOpacity style={st.inputStyle} onPress={() => {
                showPicker()
              }}>
                <View style={st.businessTimeCon}>
                  <Text>{date ? date?.toDateString() : 'Select Birthday'}</Text>
                  <Image source={ImageConstants.calendar} style={[st.minimgsty, { marginTop: 5 }]} />
                </View>
              </TouchableOpacity>
             </View>
</View>

        <DateTimePickerModal isVisible={isPickerVisible} 
        mode="date" date={date || tempDate} 
         maximumDate={tempDate} 
        minimumDate={minDate} onConfirm={handleConfirm} 
        onCancel={hidePicker} />

        <View style={{width: WIDTH - 30}}>
          <CustomButton
            label="Continue"
            onPress={() =>
              navigation.navigate('InterestScreen', {
                dob: moment(date).format('YYYY-MM-DD'),
              })
            }
          />
        </View>
      </ScrollView>
    </CustomContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scrollContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 20,
  },

  birthdayTxtStyle: {
    fontFamily: fonts.semiBold,
    fontSize: wp(22),
    color: colors.black,
  },

  subTxtStyle: {
    fontFamily: fonts.regular,
    fontSize: wp(13),
    color: colors.gray,
    textAlign: 'center',
    marginTop: -30,
  },

  subTxtAlexStyle: {color: colors.primaryColor, fontFamily: fonts.semiBold},
});
export default BirthScreen;
