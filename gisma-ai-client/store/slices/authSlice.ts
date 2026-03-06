import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { api, authApi, handleAxiosError } from '@/utils/api';
import { AUTH_ENDPOINTS } from '@/utils/auth';
import { LoginUserDto, RegisterUserDto, User } from '@/types/user';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

const initialState: AuthState = {
  user: null,
  isAdmin: false,
  loading: true, // Start with true to prevent flash of unauthenticated content
  error: null,
};

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.post(AUTH_ENDPOINTS.REFRESH_TOKEN, {}, {withCredentials: true});
      
      return response.data;
    } catch (error) {
      // Silently fail - user might not have a valid refresh token
      return rejectWithValue(null);
    }
  }
);


export const login = createAsyncThunk(
  'auth/login',
  async (userData: LoginUserDto, { dispatch, rejectWithValue }) => {
    try {
      await api.post(AUTH_ENDPOINTS.LOGIN, userData, { withCredentials: true });
      const user = await dispatch(getUser()).unwrap();

      return user;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const getUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const userResponse = await authApi.get(AUTH_ENDPOINTS.ME, {withCredentials: true});
   
      return userResponse.data;
    } catch (error) {
      // Return null instead of error message for faster handling
      return rejectWithValue(null);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterUserDto, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.SIGNUP, userData, {withCredentials: true});
      return response.data;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGOUT);
      
      // Disconnect WebSocket on logout
      if (typeof window !== 'undefined') {
        // Create a simple disconnect function
        const disconnectWebSocket = () => {
          // Find and disconnect any existing WebSocket connections
          const event = new CustomEvent('websocket-disconnect');
          window.dispatchEvent(event);
        };
        disconnectWebSocket();
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
  })
  .addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = {...action.payload};
      state.isAdmin = state.user?.role === 'ADMIN';
  })
  .addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
  })
  .addCase(logout.pending, (state) => {
      state.loading = false; // Don't show loading during logout
      state.error = null;
  })
  .addCase(logout.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.isAdmin=false;
  })
  .addCase(logout.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
  })
  .addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
  })
  .addCase(register.fulfilled, (state) => {
      state.loading = false;
  })
  .addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
  })
  .addCase(getUser.pending, (state) => {
      state.loading = true;
      state.error = null;
  })
  .addCase(getUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = {...action.payload};
      state.isAdmin = state.user?.role === 'ADMIN';
  })
  .addCase(getUser.rejected, (state) => {
      state.loading = false;
      state.isAdmin = false;
      state.user = null;
      // Don't set error for failed auth check - it's expected when not authenticated
  })
  .addCase(refreshToken.fulfilled, (state) => {
      // Refresh token succeeded, but don't change loading state here
      // Loading state is controlled by getUser
  })
  .addCase(refreshToken.rejected, (state) => {
      // Refresh token failed, but don't change loading state here
      // Loading state is controlled by getUser
  });
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer; 