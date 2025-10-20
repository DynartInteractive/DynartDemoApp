import React from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login-container">
          <IonCard className="login-card">
            <IonCardHeader>
              <IonCardTitle className="ion-text-center">
                Welcome to DynartDemo
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="login-content">
                <p className="ion-text-center">
                  Please sign in to continue
                </p>
                <IonButton
                  expand="block"
                  onClick={handleLogin}
                  className="google-login-button"
                >
                  <IonIcon slot="start" icon={logoGoogle} />
                  Sign in with Google
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
