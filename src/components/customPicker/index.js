// import React from 'react';
// import { View, Text, StyleSheet, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { colors, fonts, wp } from '../../constants';
// import st from '../../global/styles'

// const CustomPicker = ({
//   label,
//   selectedValue,
//   onValueChange,
//   items = [],
//   placeholder = 'Select an option',
//   style = {},
//   fontFamily = 'System',
//   showIcon = true,
//   error = '',
//   disabled
// }) => {
//   return (
//     <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
//     <View style={styles.container}>
//       {label && <Text style={[styles.label, { fontFamily }]}>{label}</Text>}
     
//       <View  style={[
//           styles.pickerWrapper,
//           style,
//           error ? styles.errorBorder : null,
//           disabled ? styles.disabledWrapper : null, // 🆕
//         ]}>
      
//         <Picker enabled={!disabled}
//           selectedValue={selectedValue}
//           onValueChange={(value, index) => {
//             Keyboard.dismiss(); // ← this ensures keyboard hides
//             onValueChange(value, index);
//           }}
//           style={[
//             styles.picker,
//             { fontFamily },
//             disabled ? styles.disabledText : null, // 🆕
//           ]}
//           dropdownIconColor="transparent" // Hide native icon on Android
//         >
//           <Picker.Item label={'Select'} value="" color={colors.grey} />
//           {items.map((item) => (
//             <Picker.Item key={item.value} label={item.label} value={item.value} />
//           ))}
//         </Picker>
//       </View>

//       {error ? <Text style={styles.error}>{error}</Text> : null}
//     </View>
//     </TouchableWithoutFeedback>

//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginBottom: 15,
//   },
//   label: {
//     marginBottom: 8,
//     // ...st.tx12
//     fontFamily: fonts.extraBold,
//     fontSize: wp(14),
//     color: colors.black,
//   },
//   pickerWrapper: {
//     borderWidth: 0,
//     borderColor: '#ccc',
//     borderRadius: 6,
//     overflow: 'hidden',
//     position: 'relative',
//     backgroundColor:colors.lightPrimaryColor
//   },
//   picker: {
//     height: 55,
//     width: '100%',
//     paddingHorizontal: 12,
//   },
//   icon: {
//     position: 'absolute',
//     right: 12,
//     top: Platform.OS === 'ios' ? 20 : 15,
//     zIndex: 1,
//   },
//   error: {
//     ...st.tx12,
//     color: 'red',
//     marginTop: 4,
//   },
//   disabledWrapper: {
//     backgroundColor: colors.disabled,
//     borderColor: '#ddd',
//   },
//   disabledText: {
//     color: '#aaa',
//   },
//   errorBorder: {
//     borderColor: 'red',
//   },
// });

// export default CustomPicker;




import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { colors, fonts, wp } from '../../constants';

const CustomPicker = ({
  label,
  items = [],
  value,
  onValueChange,
  placeholder = 'Select',
  fontFamily,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel =
    items.find(i => i.value === value)?.label || placeholder;

  const filteredData = useMemo(() => {
    if (!search) return items;
    return items.filter(i =>
      i.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, items]);

  return (
    <View style={{marginBottom: wp(15)}}>
      {label && (
        <Text style={{marginBottom: 6, fontFamily}}>
          {label}
        </Text>
      )}

      {/* Selected box */}
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{
          padding: wp(12),
          backgroundColor: colors.lightPrimaryColor,
          borderRadius: 6,
        }}>
        <Text>{selectedLabel}</Text>
      </TouchableOpacity>

      {open && (
        <View
          style={{
            marginTop: 6,
            backgroundColor: colors.white,
            borderRadius: 6,
            elevation: 3,
          }}>

          {/* Search */}
         {/* Search Input */}
<TextInput
  placeholder="Search business..."
  placeholderTextColor={colors.gray}
  value={search}
  onChangeText={setSearch}
  style={{
    paddingVertical: wp(10),
    paddingHorizontal: wp(12),
    fontSize: wp(14),
    fontFamily: fonts.medium,
    color: colors.black,
    backgroundColor: colors.lightPrimaryColor,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 1,
    borderColor: colors.gray + '40',
  }}
/>


          {/* List */}
          <FlatList
            data={filteredData}
            keyExtractor={item => item.value}
            keyboardShouldPersistTaps="handled"
            style={{maxHeight: wp(220), borderColor:colors.gray, borderWidth:0.6}}
            renderItem={({item}) => {
              const isSelected = item.value === value;
            
              return (
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                    setSearch('');
                  }}
                  style={{
                    paddingVertical: wp(12),
                    paddingHorizontal: wp(14),
                    backgroundColor: isSelected
                      ? colors.primaryColor + '15'
                      : colors.white,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderColor: colors.gray + '30',
                  }}>
                  
                  <Text
                    style={{
                      fontSize: wp(14),
                      fontFamily: fonts.regular,
                      color: isSelected ? colors.primaryColor : colors.black,
                    }}>
                    {item.label}
                  </Text>
            
                  {isSelected && (
                    <Text
                      style={{
                        fontSize: wp(12),
                        color: colors.primaryColor,
                        fontFamily: fontFamily,
                      }}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <Text style={{padding: wp(12), color: colors.gray}}>
                No business found
              </Text>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default CustomPicker;
