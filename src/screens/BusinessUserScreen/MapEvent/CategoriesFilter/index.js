import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import BackHeader from '../../../../components/BackHeader';
import { colors } from '../../../../constants';
import CustomContainer from '../../../../components/container';
import st from '../../../../global/styles';

const categories = [
  'Restaurant',
  'Travel',
  'Shopping',
  'Cafe, Coffee, Tea House',
  'Bars',
  'Parks',
  'Arts and Entertainment',
];

const FilterScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('Travel');

  return (
   <CustomContainer>
      <BackHeader label='Select a filter for Noida' />
       <View style={st.pd20}>
      {/* Categories */}
      <View>
        <View style={styles.sectionHeader}>
          <Icon name="storefront-outline" size={18} color={colors.black} />
          <Text style={st.labelStyle}>  Categories</Text>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setSelectedCategory(item)}>
              <Text style={styles.filterText}>{item}</Text>
              <View style={styles.radioOuter}>
                {selectedCategory === item && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.clearBtn}>
          <Text style={st.errorText}>Clear Filters (1)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.showBtn}>
          <Text style={st.filterText}>Show Results</Text>
        </TouchableOpacity>
      </View>
     
      </CustomContainer>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryColor,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    position:'absolute',
    bottom:0
  },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent:'center'
  },
  showBtn: {
    flex: 1,
    backgroundColor: colors.primaryColor,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    paddingVertical:5,
    maxWidth:150
  },
});

export default FilterScreen;
