using System.Security.Claims;
using DynartDemoApp.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

namespace DynartDemoApp.Services;

public class PermissionClaimsTransformation(ApplicationDbContext db) : IClaimsTransformation
{
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
            return principal;

        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email))
            return principal;

        var permissions = await db.Users
            .Where(u => u.Email == email)
            .SelectMany(u => u.UserRoles)
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToListAsync();

        var claimsIdentity = new ClaimsIdentity();
        foreach (var permission in permissions)
        {
            claimsIdentity.AddClaim(new Claim("permission", permission));
        }

        principal.AddIdentity(claimsIdentity);
        return principal;
    }
}
