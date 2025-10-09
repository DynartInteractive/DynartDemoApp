import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

export async function initGoogleAuth() {
  if (Capacitor.isNativePlatform()) {
    GoogleAuth.initialize({
      clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  }
}

export async function signInWithGoogle(): Promise<string> {
  try {
    const result = await GoogleAuth.signIn();
    return result.authentication.idToken;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleAuth.signOut();
  } catch (error) {
    console.error('Google sign out error:', error);
  }
}
