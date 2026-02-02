import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Portfolio from './pages/Portfolio';
import Activity from './pages/Activity';
import StockDetail from './pages/StockDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AuthSuccess from './pages/AuthSuccess';
import AddFunds from './pages/AddFunds';
import IPOHub from './pages/IPOHub';
import Support from './pages/Support';

import Landing from './pages/Landing';

const ProtectedLayout = ({ children }) => {
  const auth = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Wait for AuthContext to finish loading from localStorage
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-xs">Synchronizing Session...</p>
        </div>
      </div>
    );
  }

  const { user } = auth;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-indigo-500/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#0a0a0a] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-tighter">
              Trade AI
            </h1>
          </div>
        </header>

        <Navbar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth-success" element={<AuthSuccess />} />

            <Route path="/dashboard" element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            } />
            <Route path="/market" element={
              <ProtectedLayout>
                <Market />
              </ProtectedLayout>
            } />
            <Route path="/market/:symbol" element={
              <ProtectedLayout>
                <StockDetail />
              </ProtectedLayout>
            } />
            <Route path="/portfolio" element={
              <ProtectedLayout>
                <Portfolio />
              </ProtectedLayout>
            } />
            <Route path="/activity" element={
              <ProtectedLayout>
                <Activity />
              </ProtectedLayout>
            } />
            <Route path="/add-funds" element={
              <ProtectedLayout>
                <AddFunds />
              </ProtectedLayout>
            } />
            <Route path="/ipo" element={
              <ProtectedLayout>
                <IPOHub />
              </ProtectedLayout>
            } />
            <Route path="/support" element={
              <ProtectedLayout>
                <Support />
              </ProtectedLayout>
            } />
            <Route element={<AdminRoute />}>
              <Route path="/admin/*" element={
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              } />
            </Route>
          </Routes>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
