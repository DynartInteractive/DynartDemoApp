using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

namespace DynartDemoApp.Controllers;

[ApiController]
[Route("api/login")]
public class LoginController(ILogger<LoginController> logger) : ControllerBase
{
    private readonly ILogger<LoginController> _logger = logger;

    [HttpGet("google")]
    public IActionResult Google()
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = "/api/post-login"
        };
        return Challenge(properties, "Google");
    }

}