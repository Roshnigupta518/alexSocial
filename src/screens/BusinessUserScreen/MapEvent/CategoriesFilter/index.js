import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import BackHeader from '../../../../components/BackHeader';
import { colors } from '../../../../constants';
import CustomContainer from '../../../../components/container';
import st from '../../../../global/styles';
import { getAllBusinessCategoryRequest } from '../../../../services/Utills';
import Toast from '../../../../constants/Toast';
import NotFoundAnime from '../../../../components/NotFoundAnime';
import { clearSelectedCategoryId, setSelectedCategoryId } from '../../../../redux/Slices/FilterCategory';
import { useDispatch, useSelector } from 'react-redux';

const FilterScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const dispatch = useDispatch();
  const filterCategoryId = useSelector(state => state.FilterCategorySlice.selectedCategory);

console.log({filterCategoryId})
  const getCategories = () => {
    setIsLoading(true);
    getAllBusinessCategoryRequest()
      .then(res => {
        // console.log({res})
        setCategories(res?.result);
      })
      .catch(err => {
        Toast.error('Business Categories', err?.message);
      })
      .finally(() => setIsLoading(false));
  };

  const handleClearFilters = () => {
    // setSelectedCategory(null);
    dispatch(clearSelectedCategoryId(null))
  };

  useEffect(() => {
    getCategories();
  }, [])

  return (
    <CustomContainer>
      <BackHeader label='Select a filter for Noida' />
        <FlatList
          data={categories}
          contentContainerStyle={[st.pd20, st.flex]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() =>
              dispatch(setSelectedCategoryId(item._id))
                }>
              <Text style={styles.filterText}>{item.title}</Text>
              <View style={styles.radioOuter}>
                {filterCategoryId === item._id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={() => (
            <View style={styles.sectionHeader}>
              <Icon name="storefront-outline" size={18} color={colors.black} />
              <Text style={st.labelStyle}>  Categories</Text>
            </View>
          )}
          ListEmptyComponent={()=><NotFoundAnime isLoading={isLoading} />}
         
        />

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.clearBtn} onPress={() => handleClearFilters()} >
          <Text style={st.errorText}> {filterCategoryId ? 'Clear Filters (1)' : 'Clear Filters'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.showBtn, { opacity: filterCategoryId === null ? 0.6 : 1 }]}
          disabled={filterCategoryId === null}
          // onPress={() => navigation.goBack()}
          onPress={() => {
            // dispatch(setSelectedCategoryId(selectedCategory))
            navigation.navigate('ExploreScreen')
          }}>
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
    // position: 'absolute',
    // bottom: 0
  },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  showBtn: {
    flex: 1,
    backgroundColor: colors.primaryColor,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    paddingVertical: 5,
    maxWidth: 150
  },
});

export default FilterScreen;
