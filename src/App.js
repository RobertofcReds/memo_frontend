// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importation des pages principales (publiques)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Regions from './pages/Regions';
import Activities from './pages/Activities';
import Blog from './pages/Blog';

// Importation des pages utilitaires et utilisateur
import NotFound from './pages/NotFound';
import Preferences from './pages/Preferences';
import Favorites from './pages/Favorites';
import History from './pages/History';
import Reviews from './pages/Reviews';
import Search from './pages/Search';
import About from './pages/About';
import SiteDetail from './pages/SiteDetail';
import TripPage from './pages/TripPage';

// NOUVELLE IMPORTATION
import RecommendationIA from './components/recommendation/RecommendationIA';

// Importation des contextes (Providers) pour la gestion d'état global
import TripProvider from './pages/TripContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './components/Notification/NotificationProvider';

// Composant de protection des routes (HOC)
import ProtectedRoute from './components/ProtectedRoute';

// Importation des pages spécifiques (Admin, Détails Région)
import Admin from './pages/Admin';
import RegionDetail from './pages/RegionDetail';
import NosyBe from './pages/NosyBe';

function App() {
  return (
    // AuthProvider : Gère l'état de connexion de l'utilisateur
    <AuthProvider>
      {/* NotificationProvider : Permet d'afficher des notifications (toasts) dans l'app */}
      <NotificationProvider>
        {/* TripProvider : Gère les données relatives au voyage en cours */}
        <TripProvider>
          <Router>
            <Routes>
              {/* --- Routes Publiques --- */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/about" element={<About />} />
              
              {/* Pages de contenu accessibles publiquement */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/regions" element={<Regions />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/blog" element={<Blog />} />

              {/* --- Routes Protégées (Nécessitent une connexion) --- */}
              <Route path="/dashboard/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
              <Route path="/dashboard/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/dashboard/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/dashboard/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
              <Route path="/region/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/site/:id" element={<ProtectedRoute><SiteDetail /></ProtectedRoute>} />
              <Route path="/my-trip" element={<ProtectedRoute><TripPage /></ProtectedRoute>} />

               {/* NOUVELLE ROUTE POUR LA PAGE DE RECOMMANDATION */}
              <Route path="/dashboard/recommendations" element={<ProtectedRoute><RecommendationIA /></ProtectedRoute>} />

              {/* --- Routes Admin et Spécifiques --- */}
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/region/3" element={<ProtectedRoute><NosyBe /></ProtectedRoute>} />
              <Route path="/region/:id" element={<ProtectedRoute><RegionDetail /></ProtectedRoute>} />

              {/* Route 404 : Capture toutes les URL non définies */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TripProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;