import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { studentApi } from '../../services/api';
import type { Student, UsageInfo } from '../../types';

interface StudentState {
  currentStudent: Student | null;
  usageInfo: Record<string, UsageInfo>;
  loading: boolean;
  error: string | null;
}

const initialState: StudentState = {
  currentStudent: null,
  usageInfo: {},
  loading: false,
  error: null,
};

// Async thunks
export const fetchStudentByTelegramId = createAsyncThunk(
  'student/fetchStudentByTelegramId',
  async (telegramId: number, { rejectWithValue }) => {
    try {
      const student = await studentApi.getByTelegramId(telegramId);
      return student;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch student');
    }
  }
);

export const checkUsageLimit = createAsyncThunk(
  'student/checkUsageLimit',
  async ({ telegramId, feature }: { telegramId: number; feature: string }, { rejectWithValue }) => {
    try {
      const usageInfo = await studentApi.checkUsageLimit(telegramId, feature);
      return { feature, usageInfo };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check usage limit');
    }
  }
);

export const incrementUsage = createAsyncThunk(
  'student/incrementUsage',
  async ({ telegramId, feature }: { telegramId: number; feature: string }, { rejectWithValue }) => {
    try {
      const result = await studentApi.incrementUsage(telegramId, feature);
      return { feature, result };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to increment usage');
    }
  }
);

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentStudent: (state, action: PayloadAction<Student | null>) => {
      state.currentStudent = action.payload;
    },
    clearStudent: (state) => {
      state.currentStudent = null;
      state.usageInfo = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch student by Telegram ID
      .addCase(fetchStudentByTelegramId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentByTelegramId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStudent = action.payload;
      })
      .addCase(fetchStudentByTelegramId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Check usage limit
      .addCase(checkUsageLimit.fulfilled, (state, action) => {
        state.usageInfo[action.payload.feature] = action.payload.usageInfo;
      })
      // Increment usage
      .addCase(incrementUsage.fulfilled, (state, action) => {
        // Update usage info after incrementing
        if (state.usageInfo[action.payload.feature]) {
          state.usageInfo[action.payload.feature].currentUsage = 
            (state.usageInfo[action.payload.feature].currentUsage || 0) + 1;
          state.usageInfo[action.payload.feature].remaining = 
            Math.max(0, state.usageInfo[action.payload.feature].remaining - 1);
        }
      });
  },
});

export const {
  clearError,
  setCurrentStudent,
  clearStudent,
} = studentSlice.actions;

export default studentSlice.reducer;
