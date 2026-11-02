# Twacha Backend Server Startup Script (development)
# Accounts need a signing key. If you have not set one, a random key is made for this run only,
# which means everyone is logged out each time you restart. For a stable key:
#   $env:JWT_SECRET_KEY = "<a long random string>"
if (-not $env:JWT_SECRET_KEY) {
    $env:JWT_SECRET_KEY = python -c "import secrets; print(secrets.token_urlsafe(48))"
    Write-Host "No JWT_SECRET_KEY set: using a temporary key for this run." -ForegroundColor Yellow
}
Write-Host "Starting Twacha backend on http://0.0.0.0:8000..." -ForegroundColor Green
uvicorn app.main:app --host 0.0.0.0 --port 8000
