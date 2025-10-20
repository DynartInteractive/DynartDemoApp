# Permission-Based UI Guide

This guide shows the best practices for hiding/showing UI elements based on user permissions.

## Available Permissions

- `users:read` - View user data (default for all users)
- `users:write` - Edit user data (admins only)
- `admin:access` - Full administrative access (admins only)

## Method 1: Using the `usePermissions` Hook (Recommended)

Best for: Conditional rendering within components

```tsx
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  return (
    <div>
      {/* Show button only if user has specific permission */}
      {hasPermission('users:write') && (
        <button>Edit User</button>
      )}

      {/* Show if user has ANY of the listed permissions */}
      {hasAnyPermission(['users:write', 'admin:access']) && (
        <button>Manage</button>
      )}

      {/* Show only if user has ALL of the listed permissions */}
      {hasAllPermissions(['users:read', 'users:write']) && (
        <button>Advanced Edit</button>
      )}
    </div>
  );
};
```

## Method 2: Using the `PermissionGuard` Component

Best for: Wrapping larger sections of UI or for cleaner JSX

```tsx
import { PermissionGuard } from '../components/PermissionGuard';

const MyComponent = () => {
  return (
    <div>
      {/* Single permission check */}
      <PermissionGuard permission="users:write">
        <button>Edit User</button>
      </PermissionGuard>

      {/* Check if user has ANY of these permissions */}
      <PermissionGuard anyPermissions={['users:write', 'admin:access']}>
        <div className="admin-section">
          <h2>Admin Controls</h2>
          <button>Delete</button>
        </div>
      </PermissionGuard>

      {/* Check if user has ALL of these permissions */}
      <PermissionGuard allPermissions={['users:read', 'users:write']}>
        <button>Advanced Feature</button>
      </PermissionGuard>

      {/* Show fallback content if permission is missing */}
      <PermissionGuard
        permission="admin:access"
        fallback={<p>You need admin access to view this</p>}
      >
        <div>Admin Content</div>
      </PermissionGuard>
    </div>
  );
};
```

## Method 3: Direct Access to Permissions Array

Best for: Complex permission logic or debugging

```tsx
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { permissions } = useAuth();

  const canManageUsers = permissions.includes('users:write') ||
                         permissions.includes('admin:access');

  return (
    <div>
      <p>Your permissions: {permissions.join(', ')}</p>
      {canManageUsers && <button>Manage Users</button>}
    </div>
  );
};
```

## Real-World Examples

### Example 1: Conditional Button Visibility
```tsx
// UsersList.tsx
{hasPermission('users:write') && (
  <IonButton onClick={() => editUser(user.id)}>
    <IonIcon icon={create} />
    Edit
  </IonButton>
)}
```

### Example 2: Navigation Menu Items
```tsx
// App.tsx
{hasPermission('users:read') && (
  <IonButton onClick={() => history.push('/users')}>
    <IonIcon icon={people} />
    Users
  </IonButton>
)}
```

### Example 3: Protecting Entire Sections
```tsx
<PermissionGuard permission="admin:access">
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Admin Panel</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      {/* Admin-only content */}
    </IonCardContent>
  </IonCard>
</PermissionGuard>
```

## Important Security Notes

⚠️ **Frontend permission checks are for UX only!**

- Always enforce permissions on the backend using `[Authorize(Policy = "permission:name")]`
- Frontend checks only hide UI elements - they don't prevent API calls
- A malicious user can bypass frontend checks, so backend validation is critical

## Backend Permission Enforcement

Always protect your API endpoints:

```csharp
[HttpPost]
[Authorize(Policy = "users:write")]
public IActionResult CreateUser([FromBody] CreateUserRequest request)
{
    // Only users with "users:write" permission can access this
    return Ok();
}
```

## Testing Different Permission Levels

To test UI with different permissions:
1. Log in as a regular user (has `users:read` only)
2. Log in as an admin (has all permissions)
3. Check that UI elements appear/disappear correctly
