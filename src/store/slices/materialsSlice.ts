import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { materialsApi } from '../../services/api';
import type { Material, MaterialFilters, LoadingState } from '../../types';

interface MaterialsState extends LoadingState {
  materials: Material[];
  selectedMaterial: Material | null;
  filters: MaterialFilters;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: MaterialsState = {
  materials: [],
  selectedMaterial: null,
  isLoading: false,
  error: null,
  filters: {
    category: '',
    type: '',
    difficulty: '',
    search: '',
    page: 1,
    limit: 10,
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

// Async thunks
export const fetchMaterials = createAsyncThunk(
  'materials/fetchMaterials',
  async (params: MaterialFilters | undefined, { rejectWithValue }) => {
    try {
      const result = await materialsApi.getAll(params);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Unable to load materials. Please try again.');
    }
  }
);

export const fetchMaterialById = createAsyncThunk(
  'materials/fetchMaterialById',
  async (id: string, { rejectWithValue }) => {
    try {
      const material = await materialsApi.getById(id);
      return material;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Unable to load material. Please try again.');
    }
  }
);


export const viewMaterial = createAsyncThunk(
  'materials/viewMaterial',
  async (id: string, { rejectWithValue }) => {
    try {
      await materialsApi.view(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record view');
    }
  }
);

const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedMaterial: (state, action: PayloadAction<Material | null>) => {
      state.selectedMaterial = action.payload;
    },
    incrementViewCount: (state, action: PayloadAction<string>) => {
      const material = state.materials.find(m => m.id === action.payload);
      if (material) {
        material.viewCount = (material.viewCount || 0) + 1;
      }
      if (state.selectedMaterial?.id === action.payload) {
        state.selectedMaterial.viewCount = (state.selectedMaterial.viewCount || 0) + 1;
      }
    },
    setFilters: (state, action: PayloadAction<Partial<MaterialFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch materials
      .addCase(fetchMaterials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.materials = action.payload.data;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch material by ID
      .addCase(fetchMaterialById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMaterialById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedMaterial = action.payload;
      })
      .addCase(fetchMaterialById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // View material
      .addCase(viewMaterial.fulfilled, (state, action) => {
        // View count is incremented on the server, but we can also update locally
        const material = state.materials.find(m => m.id === action.payload);
        if (material) {
          material.viewCount = (material.viewCount || 0) + 1;
        }
        if (state.selectedMaterial?.id === action.payload) {
          state.selectedMaterial.viewCount = (state.selectedMaterial.viewCount || 0) + 1;
        }
      });
  },
});

export const {
  clearError,
  setSelectedMaterial,
  incrementViewCount,
} = materialsSlice.actions;

export default materialsSlice.reducer;
