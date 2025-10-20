import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import { create, peopleOutline, trash } from 'ionicons/icons';
import { apiClient } from '../api/client';
import type { User } from '../types';
import { usePermissions } from '../hooks/usePermissions';

const UsersList: React.FC = () => {
  const history = useHistory();
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      await apiClient.deleteUser(userToDelete.id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Users</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonSearchbar
            placeholder="Search users..."
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value || '')}
          />

          <IonItem>
            <IonLabel>Filter by Role</IonLabel>
            <IonSelect value={roleFilter} onIonChange={(e) => setRoleFilter(e.detail.value)}>
              <IonSelectOption value="">All Roles</IonSelectOption>
              <IonSelectOption value="Admin">Admin</IonSelectOption>
              <IonSelectOption value="User">User</IonSelectOption>
            </IonSelect>
          </IonItem>

          {loading && (
            <div className="loading">
              <IonSpinner />
              <p>Loading users...</p>
            </div>
          )}

          {error && <div className="error">{error}</div>}

          {!loading && !error && (
            <>
              {filteredUsers.map((user) => (
                <IonCard key={user.id} className="user-card">
                  <IonCardHeader>
                    <IonCardTitle>{user.displayName}</IonCardTitle>
                    <IonCardSubtitle>{user.email}</IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonBadge color={user.role === 'Admin' ? 'primary' : 'secondary'}>
                      {user.role}
                    </IonBadge>
                    <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                    {user.updatedAt && (
                      <p>Updated: {new Date(user.updatedAt).toLocaleDateString()}</p>
                    )}

                    <div className="user-actions">
                      {hasPermission('users:write') && (
                        <IonButton size="small" onClick={() => history.push(`/users/edit/${user.id}`)}>
                          <IonIcon slot="start" icon={create} />
                          Edit
                        </IonButton>
                      )}
                      {hasPermission('admin:access') && (
                        <IonButton size="small" color="danger" onClick={() => confirmDelete(user)}>
                          <IonIcon slot="start" icon={trash} />
                          Delete
                        </IonButton>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}

              {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <IonIcon icon={peopleOutline} style={{ fontSize: '64px', color: '#ccc' }} />
                  <p>No users found</p>
                </div>
              )}
            </>
          )}
        </IonCardContent>
      </IonCard>

      <IonAlert
        isOpen={showDeleteConfirm}
        header="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.displayName}?`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setShowDeleteConfirm(false),
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: deleteUser,
          },
        ]}
      />
    </>
  );
};

export default UsersList;
