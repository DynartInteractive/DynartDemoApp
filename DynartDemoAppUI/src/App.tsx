import React, { useEffect } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import {
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  setupIonicReact,
} from '@ionic/react';
import { home, logOut, people } from 'ionicons/icons';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/UsersList';
import UserEdit from './pages/UserEdit';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './App.css';

setupIonicReact();

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, logout } = useAuth();
  const history = useHistory();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <IonApp>
        <IonContent>
          <div className="loading">
            <p>Loading...</p>
          </div>
        </IonContent>
      </IonApp>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/')}>
              <IonIcon icon={home} />
              Dashboard
            </IonButton>
            <IonButton onClick={() => history.push('/users')}>
              <IonIcon icon={people} />
              Users
            </IonButton>
            <IonButton onClick={logout}>
              <IonIcon icon={logOut} />
              Logout
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="container">
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route exact path="/users" component={UsersList} />
            <Route path="/users/edit/:id" component={UserEdit} />
          </Switch>
        </div>
      </IonContent>
    </IonApp>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
