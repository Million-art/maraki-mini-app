import { configureStore } from '@reduxjs/toolkit';
import materialsReducer from './slices/materialsSlice';
import quizzesReducer from './slices/quizzesSlice';
import uiReducer from './slices/uiSlice';
import studentReducer from './slices/studentSlice';

export const store = configureStore({
  reducer: {
    materials: materialsReducer,
    quizzes: quizzesReducer,
    ui: uiReducer,
    student: studentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export { useAppSelector, useAppDispatch } from './hooks';
