import '@/index.css';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { LanguageToggle } from '@/components/ascii';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Verify from '@/pages/Verify';
import Dashboard from '@/pages/Dashboard';
import Leaderboard from '@/pages/Leaderboard';
import Explorer from '@/pages/Explorer';

function Protected({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <p className="p-6 movs-dim">loading...</p>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function Shell() {
    return (
        <div className="App min-h-dvh bg-[#0A0B0A] text-[#D7E6D7]">
            <Header />
            <main className="pb-24">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/verify" element={<Verify />} />
                    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/explorer" element={<Explorer />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <LanguageToggle />
        </div>
    );
}

function App() {
    return (
        <I18nProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Shell />
                </BrowserRouter>
            </AuthProvider>
        </I18nProvider>
    );
}

export default App;
