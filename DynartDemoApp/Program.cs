using System.Security.Claims;
using DynartDemoApp.Data;
using DynartDemoApp.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddHttpClient();

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Add JWT Service
builder.Services.AddScoped<IJwtService, JwtService>();

// Add claims transformation
builder.Services.AddScoped<IClaimsTransformation, PermissionClaimsTransformation>();

// Add authentication - support both Cookie and JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Cookies";
    options.DefaultChallengeScheme = "Google";
})
.AddCookie("Cookies", options =>
{
    options.Events.OnSigningIn = context =>
    {
        // Store the OAuth provider in claims for logout
        if (context.Principal?.Identity is ClaimsIdentity identity)
        {
            var authMethod = identity.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/authenticationmethod")?.Value;
            if (!string.IsNullOrEmpty(authMethod))
            {
                identity.AddClaim(new System.Security.Claims.Claim("oauth_provider", authMethod));
            }
        }
        return Task.CompletedTask;
    };
})
.AddJwtBearer("Bearer", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
})
.AddGoogle("Google", options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
    options.CallbackPath = "/signin-google";

    // Save tokens for logout
    options.SaveTokens = true;

    // Request offline access to get refresh token
    options.AccessType = "offline";

    // Prompt for consent to ensure we get tokens
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
});

// Add authorization policies - support both Cookie and JWT Bearer
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("users:read", policy =>
        policy.RequireClaim("permission", "users:read")
              .AddAuthenticationSchemes("Cookies", "Bearer"));
    options.AddPolicy("users:write", policy =>
        policy.RequireClaim("permission", "users:write")
              .AddAuthenticationSchemes("Cookies", "Bearer"));
    options.AddPolicy("admin:access", policy =>
        policy.RequireClaim("permission", "admin:access")
              .AddAuthenticationSchemes("Cookies", "Bearer"));
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Apply migrations automatically in Development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only use HTTPS redirection in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();