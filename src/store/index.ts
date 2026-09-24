import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import studentReducer from './slices/studentSlice';

export const store = configureStore({
  reducer: {
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
