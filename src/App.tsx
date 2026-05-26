import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authenticate } from './lib/auth';
import { registerServiceWorker } from './lib/push';
import { useStore } from './store';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PageBackground from './components/ui/PageBackground';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ListingDetailPage from './pages/ListingDetailPage';
import AddListingPage from './pages/AddListingPage';
import EditListingPage from './pages/EditListingPage';
import CabinetPage from './pages/CabinetPage';
import AdminPage from './pages/AdminPage';
import MapPage from './pages/MapPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  const { upsertProfile, loadAppData } = useStore();

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Authenticate via server-side HMAC validation (falls back to unsafe/demo)
  useEffect(() => {
    authenticate().then(({ profile }) => {
      if (!profile) return;
      const existing = useStore.getState().profiles.find((p) => p.id === profile.id);
      if (existing) {
        upsertProfile({ ...existing, ...profile, status: existing.status, role: profile.role });
      } else {
        upsertProfile(profile);
      }
    });
  }, [upsertProfile]);

  // Register Service Worker for Web Push
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <BrowserRouter basename="/brasov-ukrainian-app/">
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const { heroExpanded } = useStore();
  const isHome = location.pathname === '/';
  const showChrome = !isHome || heroExpanded;

  return (
    <div className="min-h-screen bg-white font-body flex flex-col">
      <PageBackground />
      {showChrome && <Header />}
      <main className={showChrome ? 'flex-1 pb-20' : 'flex-1'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/listing/:id/edit" element={<EditListingPage />} />
          <Route path="/add" element={<AddListingPage />} />
          <Route path="/cabinet" element={<CabinetPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </main>
      {showChrome && <BottomNav />}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 16, 22, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </div>
  );
}
