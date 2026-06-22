import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Competitions from './pages/Competitions';
import CompetitionDetail from './pages/CompetitionDetail';
import CreateCompetition from './pages/CreateCompetition';
import CreatorDashboard from './pages/CreatorDashboard';
import GoLive from './pages/GoLive';
import OrganizerDashboard from './pages/OrganizerDashboard';
import MatchCenter from './pages/MatchCenter';
import Pricing from './pages/Pricing';
import AdminPanel from './pages/AdminPanel';
import Streams from './pages/Streams';
import UserProfilePage from './pages/UserProfile';
import Teams from './pages/Teams';
import RoleChoice from './pages/RoleChoice';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthGuard from './components/AuthGuard';
import Watch from './pages/Watch';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading ArenaHub...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/watch/:public_share_id" element={<Watch />} />
      <Route path="/get-started" element={<RoleChoice />} />
      <Route element={<AppLayout />}>
        {/* Public within app shell */}
        <Route path="/" element={<Home />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/competitions/:id" element={<CompetitionDetail />} />
        <Route path="/streams" element={<Streams />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/teams" element={<Teams />} />
        {/* Auth-protected */}
        <Route path="/create-competition" element={<AuthGuard><CreateCompetition /></AuthGuard>} />
        <Route path="/creator-dashboard" element={<AuthGuard><CreatorDashboard /></AuthGuard>} />
        <Route path="/go-live" element={<AuthGuard><GoLive /></AuthGuard>} />
        <Route path="/organizer-dashboard" element={<AuthGuard><OrganizerDashboard /></AuthGuard>} />
        <Route path="/match-center" element={<AuthGuard><MatchCenter /></AuthGuard>} />
        <Route path="/match-center/:id" element={<AuthGuard><MatchCenter /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><UserProfilePage /></AuthGuard>} />
        {/* Admin-only */}
        <Route path="/admin" element={<AuthGuard adminOnly><AdminPanel /></AuthGuard>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;