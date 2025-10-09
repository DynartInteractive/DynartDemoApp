# DynartDemoAppUI

React-based UI for the DynartDemoApp ASP.NET Core application.

## Features

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router v5** for client-side routing
- **Ionic React** for mobile-optimized UI components
- **API Proxy** to the backend ASP.NET Core application

## Project Structure

```
src/
├── api/
│   └── client.ts          # API client for backend communication
├── contexts/
│   └── AuthContext.tsx    # Authentication context provider
├── pages/
│   ├── Dashboard.tsx      # Dashboard page showing user permissions
│   ├── UsersList.tsx      # Users list with search and filtering
│   └── UserEdit.tsx       # User edit/create form
├── types/
│   └── index.ts           # TypeScript interfaces
├── App.tsx                # Main app component with routing
└── main.tsx              # App entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- The backend ASP.NET Core application running on https://localhost:7108

### Installation

```bash
# Navigate to the UI project directory
cd DynartDemoAppUI

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The app will be available at http://localhost:3000

API requests to `/api/*` will be proxied to the backend at https://localhost:7108

### Building for Production

```bash
# Build the production bundle
npm run build

# Preview the production build
npm run preview
```

## Configuration

### API Proxy

The Vite development server is configured to proxy API requests to the backend. See `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'https://localhost:7108',
      changeOrigin: true,
      secure: false
    }
  }
}
```

## Routes

- `/` - Dashboard view showing user permissions
- `/users` - User management list with search and filtering
- `/users/edit/:id` - User edit form

## Authentication

The app uses the same authentication flow as the backend:

1. Users must be authenticated via the backend OAuth flow
2. The app checks authentication status on load
3. Unauthenticated users are redirected to the login page
4. Permissions are loaded from the backend and displayed on the dashboard

## Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v5** - Client-side routing
- **Ionic React** - Mobile-optimized UI components
- **Ionicons** - Icon library

## Migration from Alpine.js

This React app replaces the original Alpine.js/Navigo implementation in `app.html` with:

- Component-based architecture
- TypeScript for type safety
- Better code organization and maintainability
- Modern React development workflow with Vite
- Hot module replacement (HMR) for fast development
