import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Gisma Agent"></meta>
        <link rel="icon" type="image/png" href="/sa-logo.png" />
        <link rel="shortcut icon" type="image/png" href="/sa-logo.png" />
        <link rel="apple-touch-icon" href="/sa-logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
