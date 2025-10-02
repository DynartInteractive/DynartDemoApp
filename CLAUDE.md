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
- **Controllers/**: API controllers using attribute routing
  - `LoginController`: Initiates OAuth flow (`/api/login/google`)
  - `PostLoginController`: Handles post-OAuth registration and login (`/api/post-login`)
  - `LogoutController`: Handles logout with OAuth token revocation (`/api/logout`)
  - `PermissionsController`: Returns current user's permissions (`/api/permissions`)
  - `WeatherForecastController`: Example API endpoint
- **Models/**: EF Core entities (User, Role, Permission, ExternalLogin, UserRole, RolePermission)
- **Data/**: `ApplicationDbContext` with EF Core configuration, snake_case naming, and seed data
- **Services/**: `PermissionClaimsTransformation` for loading permissions as claims
- **wwwroot/**: Static files
  - `index.html`: Login page with auto-redirect to app if authenticated
  - `app.html`: Dashboard with logout button and permissions display

## Development Commands

### Build
```bash
dotnet build
```

### Run
```bash
dotnet run --project DynartDemoApp/DynartDemoApp.csproj
```

The app runs on:
- HTTPS: https://localhost:7108
- HTTP: http://localhost:5041
- Swagger UI available at /swagger in development mode

### Restore Dependencies
```bash
dotnet restore
```

### Clean Build Artifacts
```bash
dotnet clean
```

### Database Migrations
```bash
# Create a new migration
dotnet ef migrations add MigrationName --project DynartDemoApp/DynartDemoApp.csproj

# Update database
dotnet ef database update --project DynartDemoApp/DynartDemoApp.csproj

# Remove last migration
dotnet ef migrations remove --project DynartDemoApp/DynartDemoApp.csproj
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
Use the `[Authorize]` attribute with policy names:
```csharp
[Authorize(Policy = "users:read")]
[HttpGet]
public IActionResult GetUsers() { ... }
```

### Available Policies
- `users:read` - Read user data
- `users:write` - Modify user data
- `admin:access` - Administrative access

### Default Roles
- **User** (RoleId: 1) - Assigned to all new registrations, has `users:read` permission
- **Admin** (RoleId: 2) - Has all permissions (`users:read`, `users:write`, `admin:access`)

## Authentication Flow

1. **Login**: User clicks "Login with Google" → redirects to Google OAuth
2. **Callback**: Google redirects to `/signin-google` → cookie created with provider tracking
3. **Post-Login**: Redirects to `/api/post-login` → user registered/updated in DB → redirects to `/app.html`
4. **Permissions**: JavaScript fetches `/api/permissions` → displays user permissions
5. **Logout**: User clicks "Logout" → revokes Google token → clears cookie → redirects to `/`

## Security Features

- **Token Revocation**: Google access tokens revoked on logout to prevent auto-login on shared computers
- **User Secrets**: OAuth credentials stored outside of repository using .NET User Secrets
- **Auto-Redirect**: Authenticated users auto-redirected from login page; unauthenticated users redirected from app
- **Claims-Based Auth**: Permissions loaded as claims for efficient authorization checks
- **Provider Tracking**: OAuth provider stored in claims for proper multi-provider logout

## Key Technologies

- Target Framework: .NET 8.0
- Nullable reference types: Enabled
- Implicit usings: Enabled
- Primary constructors: Used in controllers
- Database: MySQL with Pomelo.EntityFrameworkCore.MySql
- HTTP Client: IHttpClientFactory for OAuth token revocation
- Development environment enables Swagger UI and auto-migrations