import React from 'react';
import Head from 'next/head';
import { AuthPage } from '@/components/Auth';

const AuthRoute: React.FC = () => {
  return (
    <>
      <Head>
        <title>Sign In · Gisma Agent</title>
      </Head>
      <AuthPage mode="signin" />
    </>
  );
};

export default AuthRoute;

