import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
} from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { permissions, loading } = useAuth();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Your Permissions</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {loading ? (
          <div className="loading">
            <IonSpinner />
            <p>Loading permissions...</p>
          </div>
        ) : (
          <>
            {permissions.length > 0 ? (
              <IonList>
                {permissions.map((permission) => (
                  <IonItem key={permission} className="permission-item">
                    <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                    <IonLabel>{permission}</IonLabel>
                  </IonItem>
                ))}
              </IonList>
            ) : (
              <p>No permissions assigned</p>
            )}
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default Dashboard;
