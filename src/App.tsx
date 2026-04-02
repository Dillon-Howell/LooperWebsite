import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CursorTrail from './components/CursorTrail';
import EasterEgg from './components/EasterEgg';
import Home from './pages/Home';
import LooperPage from './pages/LooperPage';
import Community from './pages/Community';
import PostDetail from './pages/PostDetail';
import UserProfile from './pages/UserProfile';
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Help from './pages/Help';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetail from './pages/AdminUserDetail';
import ProfileHub from './pages/ProfileHub';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import UsernameSetup from './pages/UsernameSetup';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/looper" element={<LooperPage />} />
        <Route path="/looper/community" element={<Community />} />
        <Route path="/looper/post/:postId" element={<PostDetail />} />
        <Route path="/looper/user/:userId" element={<UserProfile />} />
        <Route path="/support" element={<Support />} />
        <Route path="/help" element={<Help />} />
        <Route path="/looper/help" element={<Help />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/profile" element={<ProfileHub />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/username" element={<UsernameSetup />} />
        <Route path="/admin/analytics" element={<AdminDashboard />} />
        <Route path="/admin/user/:userId" element={<AdminUserDetail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <CursorTrail />
        <EasterEgg />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
