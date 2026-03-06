import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { refreshToken, getUser } from '@/store/slices/authSlice';
import ParticlesBackground from '@/components/Global/Particles';

const inter = Inter({ subsets: ['latin'] });

// Create a dark theme for MUI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#1e40af',
    },
    background: {
      default: 'transparent',
      paper: 'transparent',
    },
  },
  typography: {
    fontFamily: inter.style.fontFamily,
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,58,138,0.8) 100%)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
  },
});

// Inner component that uses hooks
function AppContent({ Component, pageProps, router }: AppProps<{}>) {
  const dispatch = useAppDispatch();
  
  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Run auth checks in parallel for faster loading
      await Promise.allSettled([
        dispatch(refreshToken()),
        dispatch(getUser()),
      ]);
    };
    initializeAuth();

    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      dispatch(refreshToken());
    }, 1000 * 60 * 10); // Refresh every 10 minutes

    return () => clearInterval(refreshInterval);
  }, [dispatch]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className={inter.className}>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              },
              success: {
                style: {
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ade80',
                },
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                style: {
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                },
                iconTheme: {
                  primary: '#f87171',
                  secondary: '#fff',
                },
              },
              loading: {
                style: {
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                },
                iconTheme: {
                  primary: '#60a5fa',
                  secondary: '#fff',
                },
              },
            }}
          />
          {(
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <Component {...pageProps} />
              </div>
            </div>
          )}
        </div>
      </ThemeProvider>
  );
}

function App(props: AppProps<{}>) {
  const { Component, pageProps } = props;
  
  return (
    <Provider store={store}>
      <AppContent Component={Component} pageProps={pageProps} router={props.router} />
    </Provider>
  );
}

export default App;
