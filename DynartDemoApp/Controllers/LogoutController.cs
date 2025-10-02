using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DynartDemoApp.Controllers;

[ApiController]
[Route("api/logout")]
public class LogoutController(
    ILogger<LogoutController> logger,
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory)
    : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get()
    {
        // Get the OAuth provider from claims
        var provider = User.FindFirst("oauth_provider")?.Value ?? "Google";

        // Get the base URL from configuration or use default
        var baseUrl = configuration["AppBaseUrl"] ?? "https://localhost:7108";

        // Handle provider-specific logout
        switch (provider)
        {
            case "Google":
                await RevokeGoogleTokenAsync();
                break;

            case "Apple":
                // Apple logout endpoint (when Apple auth is implemented)
                await HttpContext.SignOutAsync("Cookies");
                var appleLogoutUrl = $"https://appleid.apple.com/auth/logout?client_id=YOUR_APPLE_CLIENT_ID&redirect_uri={Uri.EscapeDataString(baseUrl)}";
                return Redirect(appleLogoutUrl);

            case "Facebook":
                // Facebook logout endpoint (when Facebook auth is implemented)
                await HttpContext.SignOutAsync("Cookies");
                var fbLogoutUrl = $"https://www.facebook.com/logout.php?next={Uri.EscapeDataString(baseUrl)}";
                return Redirect(fbLogoutUrl);
        }

        // Sign out from local cookie authentication
        await HttpContext.SignOutAsync("Cookies");
        logger.LogInformation("User logged out from provider: {Provider}", provider);

        return Redirect("/");
    }

    private async Task RevokeGoogleTokenAsync()
    {
        try
        {
            // Get the access token from the authentication properties
            var accessToken = await HttpContext.GetTokenAsync("access_token");

            if (!string.IsNullOrEmpty(accessToken))
            {
                var httpClient = httpClientFactory.CreateClient();
                var revokeUrl = $"https://oauth2.googleapis.com/revoke?token={accessToken}";

                var response = await httpClient.PostAsync(revokeUrl, null);

                if (response.IsSuccessStatusCode)
                {
                    logger.LogInformation("Successfully revoked Google access token");
                }
                else
                {
                    logger.LogWarning("Failed to revoke Google token: {StatusCode}", response.StatusCode);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error revoking Google token");
        }
    }
}
