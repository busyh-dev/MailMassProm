// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ 
  children, 
  permission, 
  anyPermissions,
  allPermissions,
  module,
  action,
  requireAdmin = false,
  requireSuperAdmin = false,
  fallback = '/unauthorized'
}) => {
  const location = useLocation();
  const { 
    profile,
    loading, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    canAccessModule,
    canPerformAction,
    isAdmin,
    isSuperAdmin 
  } = usePermissions();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifica permessi...</p>
        </div>
      </div>
    );
  }

  // Non autenticato
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica super admin
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to={fallback} replace />;
  }

  // Verifica admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to={fallback} replace />;
  }

  // Verifica permesso singolo
  if (permission && !hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }

  // Verifica uno qualsiasi dei permessi
  if (anyPermissions && !hasAnyPermission(anyPermissions)) {
    return <Navigate to={fallback} replace />;
  }

  // Verifica tutti i permessi
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return <Navigate to={fallback} replace />;
  }

  // Verifica modulo + azione
  if (module && action && !canPerformAction(module, action)) {
    return <Navigate to={fallback} replace />;
  }

  // Verifica accesso modulo
  if (module && !action && !canAccessModule(module)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};