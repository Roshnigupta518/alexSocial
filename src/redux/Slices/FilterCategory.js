import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedCategory: null,
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setSelectedCategoryId: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearSelectedCategoryId: (state) => {
      state.selectedCategory = null;
    },
  },
});

export const { setSelectedCategoryId, clearSelectedCategoryId } = filterSlice.actions;
export default filterSlice.reducer;
