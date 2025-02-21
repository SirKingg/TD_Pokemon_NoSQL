// pages/_app.tsx
import Head from 'next/head';
import '../styles/globals.css';
import MusicPlayer from '../components/MusicPlayer';
import { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>TD Pokémon NoSQL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* MusicPlayer ici sera monté une seule fois et restera persistant */}
      <MusicPlayer />
      <Component {...pageProps} />
    </>
  );
}
