import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, register, clearError } from '@/store/slices/authSlice';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { IconBrandGoogle, IconLock, IconUser, IconEye, IconEyeOff, IconArrowLeft } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { showToast } from '@/store/slices/toastSlice';
import { LoginUserDto } from '@/types';
import { useRouter } from 'next/router';
import ParticlesBackground from '@/components/Global/Particles';

type AuthMode = 'signin' | 'signup';

interface AuthPageProps {
  mode?: AuthMode;
}

const AuthPage: React.FC<AuthPageProps> = ({ mode = 'signin' }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [postSignUpMessage, setPostSignUpMessage] = useState<string | null>(null);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Clear any stale auth error when landing on the page
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Clear the post sign-up message when switching away from sign-in
  useEffect(() => {
    if (currentMode === 'signup') {
      setPostSignUpMessage(null);
    }
  }, [currentMode]);

  const handleGoogleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const redirectUrl = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`;
    window.location.href = redirectUrl;
  };

  const handleGoBack = () => {
    router.push('/home');
  };


  const isSignIn = currentMode === 'signin';

  // Ensure cursor focuses the username input when on sign-in
  useEffect(() => {
    if (isSignIn) {
      // Defer to after paint to avoid hydration/SSR timing issues
      const t = setTimeout(() => {
        const el = document.getElementById('username') as HTMLInputElement | null;
        el?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isSignIn]);

  const signInSchema = useMemo(
    () =>
      Yup.object({
        username: Yup.string().required('Username is required'),
        password: Yup.string().required('Password is required')
      }),
    []
  );

  const signUpSchema = useMemo(
    () =>
      Yup.object({
        username: Yup.string().required('Username is required'),
        password: Yup.string()
          .min(6, 'Must be at least 6 characters')
          .required('Password is required'),
      }),
    []
  );

  const handleSignIn = async (values: LoginUserDto) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      dispatch(showToast({message: 'Login success', type: 'success'}));
      router.push('/');
    } else {
      dispatch(showToast({message: 'Login failed', type: 'error'}));
    }
  };

  const handleSignUp = async (values: { username: string; password: string }) => {
    const result = await dispatch(register({ username: values.username, password: values.password }));
    if (register.fulfilled.match(result)) {
      dispatch(showToast({message: 'User created successfully', type: 'success'}));
      setCurrentMode('signin');
    } else {
      dispatch(showToast({message: 'Registration failed', type: 'error'}));
    }
  };

  return (
    <div className="relative min-h-screen md:h-screen md:overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-gray-950 via-slate-950 to-black">
      {/* Particles Background */}
      <div className="absolute inset-0 z-0">
        <ParticlesBackground />
      </div>
      {/* Decorative Background (same as footer) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Base gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-slate-900/70 to-transparent" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        {/* Organic glow blobs */}
        <div className="absolute -top-10 left-1/4 w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -top-6 right-1/5 w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-40 h-16 sm:w-64 sm:h-24 rounded-full bg-cyan-400/20 blur-[60px]" />
        {/* Highlight line at the top edge */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
      {/* Left: Auth Form */}
      <div className="flex items-center justify-center py-10 md:py-0 px-6 sm:px-10 md:px-12 lg:px-16 md:h-screen">
        <div className="w-full max-w-md">
          {/* Go Back Button and Logo */}
          <div className="mb-8 flex items-center justify-between relative z-10">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 text-blue-300 hover:text-white transition-colors duration-200 cursor-pointer relative z-10"
            >
              <IconArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium"></span>
            </button>
            <div className="h-9 w-9 rounded-lg overflow-hidden">
              <img src="/sa-logo.png" alt="Gisma Agent" width={36} height={36} />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {isSignIn ? 'Welcome Back' : 'Create an Account'}
            </h1>
            
          </div>

          {/* Card */}
          <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            {/* Google first */}
            <button
              type="button"
              className="w-full inline-flex items-center justify-center py-3 rounded-xl ring-1 ring-white/15 text-blue-100 hover:bg-white/5 transition"
              onClick={handleGoogleLogin}
            >
              <IconBrandGoogle className="h-5 w-5" />
              <span className="ml-2">{isSignIn ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>

            {/* Divider (lines around the label, no overlap) */}
            <div className="my-6 flex items-center" aria-hidden="true">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="mx-4 text-blue-100 text-sm sm:text-base font-semibold tracking-wide uppercase">OR</span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {isSignIn ? (
              <Formik
                key="signin"
                initialValues={{ username: '', password: '' }}
                validationSchema={signInSchema}
                onSubmit={handleSignIn}
                validateOnBlur={false}
                validateOnChange={false}
              >
                {({ isSubmitting, submitCount, errors }) => (
                  <Form className="space-y-5">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-blue-200 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <Field
                          id="username"
                          name="username"
                          type="text"
                          autoFocus
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 text-white placeholder-blue-300/60 ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition"
                          placeholder="Enter your username"
                        />
                        <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300" />
                      </div>
                      {submitCount > 0 && errors.username && (
                        <div className="mt-1 text-sm text-red-400">{errors.username}</div>
                      )}
                    </div>
                                                                                                         
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Field
                          id="password"
                          name="password"
                          type={showSignInPassword ? 'text' : 'password'}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 text-white placeholder-blue-300/60 ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition"
                          placeholder="••••••••"
                        />
                        <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300" />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                        >
                          {showSignInPassword ? (
                            <IconEyeOff className="h-5 w-5 text-blue-300" />
                          ) : (
                            <IconEye className="h-5 w-5 text-blue-300" />
                          )}
                        </button>
                      </div>
                      {submitCount > 0 && errors.password && (
                        <div className="mt-1 text-sm text-red-400">{errors.password}</div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading || isSubmitting ? 'Signing in…' : 'Sign In'}
                    </button>
                    {postSignUpMessage && (
                      <div className="mt-3 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30 px-3 py-2 text-sm text-emerald-200 text-center">
                        {postSignUpMessage}
                      </div>
                    )}
                  </Form>
                )}
              </Formik>
            ) : (
              <Formik
                key="signup"
                initialValues={{ username: '', password: '' }}
                validationSchema={signUpSchema}
                onSubmit={handleSignUp}
                validateOnBlur={false}
                validateOnChange={false}
              >
                {({ isSubmitting, submitCount, errors }) => (
                  <Form className="space-y-5">
                    <div>
                      <label htmlFor="signupUsername" className="block text-sm font-medium text-blue-200 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <Field
                          id="signupUsername"
                          name="username"
                          type="text"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 text-white placeholder-blue-300/60 ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition"
                          placeholder="Enter your username"
                        />
                        <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300" />
                      </div>
                      {submitCount > 0 && errors.username && (
                        <div className="mt-1 text-sm text-red-400">{errors.username}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signupPassword" className="block text-sm font-medium text-blue-200 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Field
                          id="signupPassword"
                          name="password"
                          type={showSignUpPassword ? 'text' : 'password'}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 text-white placeholder-blue-300/60 ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition"
                          placeholder="••••••••"
                        />
                        <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300" />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        >
                          {showSignUpPassword ? (
                            <IconEyeOff className="h-5 w-5 text-blue-300" />
                          ) : (
                            <IconEye className="h-5 w-5 text-blue-300" />
                          )}
                        </button>
                      </div>
                      {submitCount > 0 && errors.password && (
                        <div className="mt-1 text-sm text-red-400">{errors.password}</div>
                      )}
                    </div>

                    

                    <button
                      type="submit"
                      disabled={loading || isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading || isSubmitting ? 'Creating account…' : 'Sign Up'}
                    </button>
                  </Form>
                )}
              </Formik>
            )}

            {/* Toggle */}
            <p className="mt-6 text-sm text-blue-200 text-center">
              {isSignIn ? (
                <>
                  Don’t have an account?{' '}
                  <button className="text-blue-300 hover:text-white underline underline-offset-4" onClick={() => setCurrentMode('signup')}>
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button className="text-blue-300 hover:text-white underline underline-offset-4" onClick={() => setCurrentMode('signin')}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Video (desktop) */}
      <div className="relative hidden md:block md:h-screen overflow-hidden">
        <video 
          className="absolute inset-0 h-full w-full object-cover" 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
        >
          <source src="/auth.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/40 to-black/70" />
      </div>

      {/* Video (mobile, stacked below) */}
      <div className="md:hidden">
        <div className="relative h-56 mt-10 overflow-hidden">
          <video 
            className="absolute inset-0 h-full w-full object-cover" 
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
          >
            <source src="/auth.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

