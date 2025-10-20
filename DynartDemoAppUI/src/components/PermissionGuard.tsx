import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 *
 * Usage:
 * <PermissionGuard permission="users:write">
 *   <button>Edit User</button>
 * </PermissionGuard>
 *
 * <PermissionGuard anyPermissions={["users:write", "admin:access"]}>
 *   <button>Manage</button>
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermissions) {
    hasAccess = hasAnyPermission(anyPermissions);
  } else if (allPermissions) {
    hasAccess = hasAllPermissions(allPermissions);
  }

  return <>{hasAccess ? children : fallback}</>;
};
