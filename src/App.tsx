import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store';
import { getTelegramUser } from './lib/supabase';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ListingDetailPage from './pages/ListingDetailPage';
import AddListingPage from './pages/AddListingPage';
import EditListingPage from './pages/EditListingPage';
import CabinetPage from './pages/CabinetPage';
import AdminPage from './pages/AdminPage';
import MapPage from './pages/MapPage';
import ChatPage from './pages/ChatPage';
import type { Profile } from './types';

const DEMO_ADMIN_IDS = new Set(
  (import.meta.env.VITE_ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map(Number)
);

export default function App() {
  const { upsertProfile, loadAppData } = useStore();

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  useEffect(() => {
    const tgUser = getTelegramUser();
    const demoAdmin = import.meta.env.VITE_DEMO_ADMIN === 'true';

    if (tgUser) {
      const isAdmin =
        DEMO_ADMIN_IDS.has(tgUser.id) ||
        tgUser.username === import.meta.env.VITE_ADMIN_USERNAME;
      const profile: Profile = {
        id: `tg-${tgUser.id}`,
        telegram_id: tgUser.id,
        username: tgUser.username || null,
        first_name: tgUser.first_name,
        role: isAdmin ? 'admin' : 'user',
        status: isAdmin ? 'approved' : 'pending',
        created_at: new Date().toISOString(),
      };
      const existing = useStore.getState().profiles.find((p) => p.id === profile.id);
      if (existing) {
        upsertProfile({ ...existing, ...profile, status: existing.status, role: profile.role });
      } else {
        upsertProfile(profile);
      }
    } else {
      const profile: Profile = {
        id: 'user-demo',
        telegram_id: 123456789,
        username: 'demo_user',
        first_name: 'Демо',
        role: demoAdmin ? 'admin' : 'user',
        status: 'approved',
        created_at: new Date().toISOString(),
      };
      upsertProfile(profile);
    }
  }, [upsertProfile]);

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
    <div className="min-h-screen bg-obsidian font-body flex flex-col">
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
