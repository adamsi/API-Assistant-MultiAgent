import React from 'react';
import Head from 'next/head';
import HomePage from '@/components/HomePage/HomePage';

const HomeRoute: React.FC = () => {
  return (
    <>
      <Head>
        <title>Gisma Agent</title>
        <meta name="description" content="AI assistant with gisma knowledge base." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" type="image/png" href="/sa-logo.png" />
        <link rel="shortcut icon" type="image/png" href="/sa-logo.png" />
        <link rel="apple-touch-icon" href="/sa-logo.png" />
      </Head>
      <HomePage />
    </>
  );
};

export default HomeRoute;

