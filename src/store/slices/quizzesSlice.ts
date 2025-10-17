import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { quizzesApi } from '../../services/api';
import type { Quiz, QuizAttempt, QuizAnswer, LoadingState } from '../../types';

interface QuizState extends LoadingState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  currentAttempt: QuizAttempt | null;
  attempts: QuizAttempt[];
  isSubmitting: boolean;
}

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  currentAttempt: null,
  attempts: [],
  isLoading: false,
  error: null,
  isSubmitting: false,
};

// Async thunks
export const fetchQuizzes = createAsyncThunk(
  'quizzes/fetchQuizzes',
  async (_, { rejectWithValue }) => {
    try {
      const quizzes = await quizzesApi.getAll();
      return quizzes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Unable to load quizzes. Please try again.');
    }
  }
);

export const fetchQuizById = createAsyncThunk(
  'quizzes/fetchQuizById',
  async (id: string, { rejectWithValue }) => {
    try {
      const quiz = await quizzesApi.getById(id);
      return quiz;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Unable to load quiz. Please try again.');
    }
  }
);

export const submitQuizAttempt = createAsyncThunk(
  'quizzes/submitQuizAttempt',
  async ({ quizId, telegramId, answers }: { quizId: string; telegramId: number; answers: QuizAnswer[] }, { rejectWithValue }) => {
    try {
      const attempt = await quizzesApi.submitAttempt(quizId, telegramId, answers);
      return attempt;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Unable to submit quiz. Please try again.');
    }
  }
);

export const fetchQuizAttempts = createAsyncThunk(
  'quizzes/fetchQuizAttempts',
  async (quizId: string | undefined, { rejectWithValue }) => {
    try {
      const attempts = await quizzesApi.getAttempts(quizId);
      return attempts;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quiz attempts');
    }
  }
);

const quizzesSlice = createSlice({
  name: 'quizzes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentQuiz: (state, action: PayloadAction<Quiz | null>) => {
      state.currentQuiz = action.payload;
    },
    setCurrentAttempt: (state, action: PayloadAction<QuizAttempt | null>) => {
      state.currentAttempt = action.payload;
    },
    clearCurrentQuiz: (state) => {
      state.currentQuiz = null;
      state.currentAttempt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch quizzes
      .addCase(fetchQuizzes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes = action.payload;
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch quiz by ID
      .addCase(fetchQuizById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuizById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuiz = action.payload;
      })
      .addCase(fetchQuizById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Submit quiz attempt
      .addCase(submitQuizAttempt.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitQuizAttempt.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentAttempt = action.payload;
        state.attempts.unshift(action.payload);
      })
      .addCase(submitQuizAttempt.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // Fetch quiz attempts
      .addCase(fetchQuizAttempts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuizAttempts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attempts = action.payload;
      })
      .addCase(fetchQuizAttempts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentQuiz,
  setCurrentAttempt,
  clearCurrentQuiz,
} = quizzesSlice.actions;

export default quizzesSlice.reducer;
