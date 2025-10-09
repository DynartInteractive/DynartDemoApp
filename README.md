# DynartDemoApp
A demo application for external IDP login and registration with roles and permissions.

1. Update Google Client ID in src/auth/googleAuth.ts:
   - Replace YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
   - Get from Google Cloud Console
2. JWT Secret Key in appsettings.json:
   - Replace with a secure random key (min 32 characters)
   - Store in user secrets for production

