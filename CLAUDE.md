# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DynartDemoApp is an ASP.NET Core 8.0 web application with controller-based API endpoints, OAuth authentication (Google, with support for Apple and Facebook planned), and a role-based permission system using Entity Framework Core with MySQL.

## Architecture

### Authentication & Authorization
- **OAuth Providers**: Google authentication implemented with token revocation on logout (Apple and Facebook planned)
- **Token Management**: Access tokens saved and revoked during logout for security
- **Claims-Based Authorization**: Permissions loaded as claims via `PermissionClaimsTransformation`
- **Role-Based Permissions**: Users → Roles → Permissions hierarchy
- **Cookie Authentication**: Default scheme with OAuth as challenge scheme
- **Multi-Provider Tracking**: Provider stored in claims for provider-specific logout

### Database Architecture
- **ORM**: Entity Framework Core with MySQL (Pomelo provider)
- **Naming Convention**: All tables and columns use snake_case (e.g., `users`, `external_logins`, `created_at`)
- **User Management**: Email is the primary identifier across OAuth providers
- **External Logins**: Multiple OAuth providers can be linked to a single user account
- **Auto-Migration**: Database migrations apply automatically in Development environment on startup
- **Permission Model**:
  - `User` has many `UserRole` (many-to-many)
  - `Role` has many `RolePermission` (many-to-many)
  - `Permission` defines granular access rights (e.g., "users:read", "admin:access")

### Project Structure

#### Backend (DynartDemoApp/)
- **Controllers/**: API controllers using attribute routing
  - `LoginController`: Initiates OAuth flow (`/api/login/google`)
  - `PostLoginController`: Handles post-OAuth registration and login (`/api/post-login`)
  - `LogoutController`: Handles logout with OAuth token revocation (`/api/logout`)
  - `PermissionsController`: Returns current user's permissions (`/api/permissions`)
  - `UsersController`: CRUD operations for user management (`/api/users`)
  - `WeatherForecastController`: Example API endpoint
- **Models/**: EF Core entities (User, Role, Permission, ExternalLogin, UserRole, RolePermission)
- **Data/**: `ApplicationDbContext` with EF Core configuration, snake_case naming, and seed data
- **Services/**: `PermissionClaimsTransformation` for loading permissions as claims

#### Frontend (DynartDemoAppUI/)
- **src/api/**: API client for backend communication
- **src/contexts/**: React contexts (AuthContext)
- **src/pages/**: Page components (Dashboard, UsersList, UserEdit)
- **src/types/**: TypeScript type definitions
- **React + TypeScript**: Component-based UI with type safety
- **Vite**: Fast development server with HMR
- **Ionic React**: Mobile-optimized UI components

## Development Commands

### Backend (ASP.NET Core)

#### Build
```bash
dotnet build
```

#### Run
```bash
dotnet run --project DynartDemoApp/DynartDemoApp.csproj
```

The backend runs on:
- HTTPS: https://localhost:7108
- HTTP: http://localhost:5041
- Swagger UI available at /swagger in development mode

#### Restore Dependencies
```bash
dotnet restore
```

#### Clean Build Artifacts
```bash
dotnet clean
```

#### Database Migrations
```bash
# Create a new migration
dotnet ef migrations add MigrationName --project DynartDemoApp/DynartDemoApp.csproj

# Update database
dotnet ef database update --project DynartDemoApp/DynartDemoApp.csproj

# Remove last migration
dotnet ef migrations remove --project DynartDemoApp/DynartDemoApp.csproj
```

### Frontend (React + Vite)

#### Install Dependencies
```bash
cd DynartDemoAppUI
npm install
```

#### Run Development Server
```bash
cd DynartDemoAppUI
npm run dev
```

The frontend runs on http://localhost:3000 and proxies API requests to the backend at https://localhost:7108

#### Build for Production
```bash
cd DynartDemoAppUI
npm run build
```

#### Preview Production Build
```bash
cd DynartDemoAppUI
npm run preview
```

## Configuration

### Connection String
Update `appsettings.json` or `appsettings.Development.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=dynartdemo;User=root;Password=your_password;"
}
```

### Google OAuth
**Recommended: Use User Secrets for local development:**
```bash
dotnet user-secrets set "Authentication:Google:ClientId" "your-client-id" --project DynartDemoApp/DynartDemoApp.csproj
dotnet user-secrets set "Authentication:Google:ClientSecret" "your-client-secret" --project DynartDemoApp/DynartDemoApp.csproj
```

Alternatively, configure in `appsettings.Development.json` (not recommended for public repos):
```json
"Authentication": {
  "Google": {
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret"
  }
}
```

**Google Cloud Console Configuration:**
- Authorized redirect URI: `https://localhost:7108/signin-google`
- Authorized JavaScript origins: `https://localhost:7108`, `http://localhost:5041`

### Application Base URL
Set in `appsettings.Development.json` for logout redirects:
```json
"AppBaseUrl": "http://localhost:5041"
```

## Authorization

### Protecting Endpoints
Use the `[Authorize]` attribute with policy names to protect endpoints by permission:

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "users:read")]
    public IActionResult GetUsers()
    {
        // Only users with "users:read" permission can access this
        return Ok(new { users = new[] { "user1", "user2" } });
    }

    [HttpPost]
    [Authorize(Policy = "users:write")]
    public IActionResult CreateUser([FromBody] CreateUserRequest request)
    {
        // Only users with "users:write" permission can access this
        return Ok();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "admin:access")]
    public IActionResult DeleteUser(int id)
    {
        // Only users with "admin:access" permission can access this
        return NoContent();
    }
}
```

### Available Policies
- `users:read` - Read user data
- `users:write` - Modify user data
- `admin:access` - Administrative access

### Default Roles
- **User** (RoleId: 1) - Assigned to all new registrations, has `users:read` permission
- **Admin** (RoleId: 2) - Has all permissions (`users:read`, `users:write`, `admin:access`)

### Adding New Permissions

1. **Add to database** (via migration or SQL):
```sql
INSERT INTO permissions (name) VALUES ('posts:create');
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, <new_permission_id>);
```

2. **Add policy to Program.cs**:
```csharp
builder.Services.AddAuthorization(options =>
{
    // ... existing policies
    options.AddPolicy("posts:create", policy =>
        policy.RequireClaim("permission", "posts:create"));
});
```

3. **Use in controller**:
```csharp
[Authorize(Policy = "posts:create")]
[HttpPost]
public IActionResult CreatePost() { ... }
```

## Frontend Architecture

### React Single-Page Application (DynartDemoAppUI)
- **Framework**: React 18 with TypeScript for component-based architecture and type safety
- **Router**: React Router v5 for client-side routing
- **UI Components**: Ionic React for mobile-optimized UI components
- **Build Tool**: Vite for fast development with hot module replacement (HMR)
- **State Management**: React Context API for authentication state
- **API Client**: Custom TypeScript client with type-safe endpoints

### Routes
- `/` - Dashboard view showing user permissions
- `/users` - User management list with search and filtering
- `/users/edit/:id` - User edit form

### Project Structure
```
DynartDemoAppUI/
├── src/
│   ├── api/
│   │   └── client.ts          # Type-safe API client
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── pages/
│   │   ├── Dashboard.tsx      # Dashboard with permissions
│   │   ├── UsersList.tsx      # Users list with search/filter
│   │   └── UserEdit.tsx       # User edit/create form
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── App.tsx                # Main app with routing
│   └── main.tsx               # Entry point
└── vite.config.ts             # Vite config with API proxy
```

### Features
- Component-based architecture with React hooks
- Client-side filtering and search
- Reactive forms with TypeScript validation
- Loading states and error handling
- Delete confirmation modals with Ionic alerts
- Type-safe API communication
- Hot module replacement (HMR) for fast development

## Authentication Flow

1. **Login**: User accesses backend at `https://localhost:7108` → clicks "Login with Google" → redirects to Google OAuth
2. **Callback**: Google redirects to `/signin-google` → cookie created with provider tracking
3. **Post-Login**: Redirects to `/api/post-login` → user registered/updated in DB
4. **Frontend Access**: User navigates to React UI at `http://localhost:3000`
5. **Auth Check**: React AuthContext checks `/api/permissions` → loads user permissions → displays dashboard
6. **API Requests**: All React API calls go through Vite proxy to backend (authenticated via cookie)
7. **Logout**: User clicks "Logout" → redirects to `/api/logout` → revokes Google token → clears cookie → redirects to login

## Security Features

- **Token Revocation**: Google access tokens revoked on logout to prevent auto-login on shared computers
- **User Secrets**: OAuth credentials stored outside of repository using .NET User Secrets
- **Auto-Redirect**: Authenticated users auto-redirected from login page; unauthenticated users redirected from app
- **Claims-Based Auth**: Permissions loaded as claims for efficient authorization checks
- **Provider Tracking**: OAuth provider stored in claims for proper multi-provider logout

## Key Technologies

### Backend
- **Target Framework**: .NET 8.0
- **Nullable reference types**: Enabled
- **Implicit usings**: Enabled
- **Primary constructors**: Used in controllers
- **Database**: MySQL with Pomelo.EntityFrameworkCore.MySql
- **HTTP Client**: IHttpClientFactory for OAuth token revocation
- **Development**: Swagger UI and auto-migrations enabled

### Frontend
- **React 18**: Modern component-based UI library
- **TypeScript**: Full type safety for better developer experience
- **Vite**: Lightning-fast build tool with HMR
- **React Router v5**: Client-side routing
- **Ionic React**: Mobile-optimized UI components
- **Ionicons**: Icon library

### Development Workflow
- **Separate Frontend/Backend**: Backend serves API only, frontend is separate Vite project
- **API Proxy**: Vite dev server proxies `/api/*` requests to backend
- **Cookie Authentication**: Auth cookies sent automatically with proxied requests
- **Hot Reload**: Both frontend (Vite HMR) and backend (dotnet watch) support hot reload