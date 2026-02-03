// src/components/Can.jsx
import { usePermissions } from '../contexts/PermissionsContext';

export const Can = ({ 
  permission,
  anyPermissions,
  allPermissions,
  module,
  action,
  requireAdmin = false,
  requireSuperAdmin = false,
  fallback = null,
  children,
  // Nuovo: per verificare ownership
  resourceType,
  resourceId
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    canAccessModule,
    canPerformAction,
    canAccessResource,
    isAdmin,
    isSuperAdmin,
    loading
  } = usePermissions();

  // Mostra loading opzionale
  if (loading) {
    return fallback;
  }

  let hasAccess = true;

  // Verifica gerarchica
  if (requireSuperAdmin) {
    hasAccess = isSuperAdmin;
  } else if (requireAdmin) {
    hasAccess = isAdmin;
  } else if (resourceType && resourceId && action) {
    hasAccess = canAccessResource(resourceType, resourceId, action);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermissions) {
    hasAccess = hasAnyPermission(anyPermissions);
  } else if (allPermissions) {
    hasAccess = hasAllPermissions(allPermissions);
  } else if (module && action) {
    hasAccess = canPerformAction(module, action);
  } else if (module) {
    hasAccess = canAccessModule(module);
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
};