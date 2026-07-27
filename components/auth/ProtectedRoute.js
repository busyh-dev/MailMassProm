// ===========================================
// PROTECTED ROUTE COMPONENT: components/auth/ProtectedRoute.js
// ===========================================

import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../src/contexts/PermissionsContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Mail, Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading: authLoading, isAuthenticated, isAdmin } = useAuth();
  const { profile, loading: permissionsLoading } = usePermissions();
  const router = useRouter();

  const loading = authLoading || permissionsLoading;

  // 🔥 DEBUG: Log stato attuale
  console.log('🛡️ ProtectedRoute render:', {
    user: user?.email,
    loading,
    isAuthenticated,
    isAdmin,
    adminOnly,
    requirePasswordChange: profile?.require_password_change,
    currentPath: router.pathname
  });

  useEffect(() => {
    console.log('🔍 ProtectedRoute useEffect:', { loading, isAuthenticated, isAdmin, adminOnly, requirePasswordChange: profile?.require_password_change });
    
    if (!loading) {
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirect to /login');
        router.push('/login');
        return;
      }

      if (profile?.require_password_change) {
        console.log('⚠️ Password change required, redirect to /login');
        router.push('/login');
        return;
      }

      if (adminOnly && !isAdmin) {
        console.log('⚠️ Admin only but user is not admin, redirect to /dashboard');
        router.push('/dashboard');
        return;
      }
      
      console.log('✅ Auth check passed, user can access');
    } else {
      console.log('⏳ Still loading auth state...');
    }
  }, [loading, isAuthenticated, isAdmin, adminOnly, router, profile]);

  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Mail className="w-12 h-12 text-blue-600 mx-auto" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">MailMassProm</h2>
          <p className="text-gray-500">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, return null (redirect in progress)');
    return null;
  }

  if (adminOnly && !isAdmin) {
    console.log('⚠️ Access denied (admin only)');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Mail className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h2>
          <p className="text-gray-600 mb-4">Non hai i permessi per accedere a questa sezione.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering protected content');
  return children;
};

export default ProtectedRoute;