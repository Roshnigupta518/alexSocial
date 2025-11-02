import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  data: {
    location_title: 'Current Location',
    location_type: 'all',
    location_coordinates: null,
    location_distance: null,
    city: null,
  },
};

export const CityMapSlice = createSlice({
  name: 'CityMap',
  initialState,
  reducers: {
    CityMapAction: (state, action) => {
      state.data = action?.payload;
    },
  },
});

export const {CityMapAction} = CityMapSlice.actions;

export default CityMapSlice.reducer;
