import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import toastReducer from './slices/toastSlice';
import uploadReducer from './slices/uploadSlice';
import chatMemoryReducer from './slices/chatMemorySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
    upload: uploadReducer,
    chatMemory: chatMemoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 