import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/store/hooks';
import { getUser } from '@/store/slices/authSlice';
import LoadingSpinner from '@/components/Global/LoadingSpinner';

const LoginSuccess: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getUser());

    const timeoutId = setTimeout(() => {
      router.push('/');
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-slate-950 to-black">
      <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl flex flex-col items-center gap-3">
        <LoadingSpinner />
       
      </div>
    </div>
  );
};

export default LoginSuccess;

