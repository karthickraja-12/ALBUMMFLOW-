import './globals.css';
import Navbar from '../components/Navbar';
import Providers from '../components/Providers';

export const metadata = {
  title: 'AlbumFlow AI - Premium Photo Selection Workflow',
  description: 'AI-powered wedding/event photo workflow platform for seamless client selection.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
