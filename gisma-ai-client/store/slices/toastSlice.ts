import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

interface ToastPayload {
  message: string;
  type: 'success' | 'error' | 'loading' | 'info';
  duration?: number;
}

const toastSlice = createSlice({
  name: 'toast',
  initialState: {},
  reducers: {
    showToast: (_, action: PayloadAction<ToastPayload>) => {
      const { message, type, duration = 4000 } = action.payload;
    
      
      switch (type) {
        case 'success':
          toast.success(message, { duration });
          break;
        case 'error':
          toast.error(message, { duration });
          break;
        case 'loading':
          toast.loading(message, { duration });
          break;
        case 'info':
          toast(message, { duration });
          break;
        default:
          toast(message, { duration });
      }
    },
  },
});

export const { showToast } = toastSlice.actions;
export default toastSlice.reducer; 