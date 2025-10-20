import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/react';
import { apiClient } from '../api/client';
import type { User } from '../types';

const UserEdit: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<Partial<User>>({
    displayName: '',
    email: '',
    role: 'User',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getUser(Number(id));
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (user.id) {
        await apiClient.updateUser(user.id, {
          name: user.displayName!,
          email: user.email!,
          role: user.role!,
        });
      } else {
        await apiClient.createUser({
          name: user.displayName!,
          email: user.email!,
          role: user.role!,
        });
      }
      history.push('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{user.id ? 'Edit User' : 'New User'}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {loading ? (
          <div className="loading">
            <IonSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <IonItem>
              <IonLabel position="stacked">Display Name *</IonLabel>
              <IonInput
                type="text"
                value={user.displayName}
                onIonInput={(e) => setUser({ ...user, displayName: e.detail.value || '' })}
                required
                placeholder="Enter display name"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Email *</IonLabel>
              <IonInput
                type="email"
                value={user.email}
                onIonInput={(e) => setUser({ ...user, email: e.detail.value || '' })}
                required
                placeholder="Enter email"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Role</IonLabel>
              <IonSelect
                value={user.role}
                onIonChange={(e) => setUser({ ...user, role: e.detail.value })}
              >
                <IonSelectOption value="User">User</IonSelectOption>
                <IonSelectOption value="Admin">Admin</IonSelectOption>
              </IonSelect>
            </IonItem>

            {error && <div className="error">{error}</div>}

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <IonButton type="submit" expand="block" disabled={saving}>
                {saving && <IonSpinner slot="start" />}
                {saving ? 'Saving...' : 'Save'}
              </IonButton>
              <IonButton
                type="button"
                color="medium"
                expand="block"
                onClick={() => history.push('/users')}
              >
                Cancel
              </IonButton>
            </div>
          </form>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default UserEdit;
