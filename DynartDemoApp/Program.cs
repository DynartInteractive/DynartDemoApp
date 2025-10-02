using DynartDemoApp.Data;
using DynartDemoApp.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddHttpClient();

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Add claims transformation
builder.Services.AddScoped<IClaimsTransformation, PermissionClaimsTransformation>();

// Add authentication
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
        var identity = context.Principal?.Identity as System.Security.Claims.ClaimsIdentity;
        if (identity != null)
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

// Add authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("users:read", policy =>
        policy.RequireClaim("permission", "users:read"));
    options.AddPolicy("users:write", policy =>
        policy.RequireClaim("permission", "users:write"));
    options.AddPolicy("admin:access", policy =>
        policy.RequireClaim("permission", "admin:access"));
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

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();