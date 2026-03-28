import { NextRequest, NextResponse } from "next/server";

/**
 * Dashboard auth proxy.
 *
 * Protection: /dashboard/** and /api/dashboard/** require authentication.
 * Auth flow:
 *   - Login via POST /api/auth/login (email + password) → sets httpOnly cookie
 *   - Cookie `dashboard_token` checked on every request
 *
 * If DASHBOARD_SECRET not set → open access (dev mode convenience).
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login API through without auth check
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Only protect /dashboard and /api/dashboard routes
  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/api/dashboard")) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/dashboard");

  const secret = process.env.DASHBOARD_SECRET;

  // If no secret configured → open access (dev mode)
  if (!secret) {
    return NextResponse.next();
  }

  // Check session cookie
  const cookieToken = req.cookies.get("dashboard_token")?.value;
  if (cookieToken === secret) {
    return NextResponse.next();
  }

  // For API routes → return 401 JSON
  if (isApiRoute) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // For page routes → show login page
  const redirectTo = encodeURIComponent(pathname);
  return new NextResponse(loginPage(redirectTo), {
    status: 401,
    headers: { "Content-Type": "text/html" },
  });
}

function loginPage(redirectTo = "/dashboard"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a1a;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 380px;
    }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .sub { font-size: 0.875rem; color: #94a3b8; margin-bottom: 1.75rem; }
    label { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.35rem; }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      color: #e2e8f0;
      font-size: 0.875rem;
      outline: none;
      margin-bottom: 1rem;
    }
    input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
    button {
      width: 100%;
      padding: 0.75rem;
      border-radius: 8px;
      border: none;
      background: #2563eb;
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    button:hover { background: #1d4ed8; }
    button:disabled { background: #1e40af; cursor: not-allowed; opacity: 0.7; }
    .err { color: #f87171; font-size: 0.8rem; margin-bottom: 0.75rem; display: none; padding: 0.5rem 0.75rem; background: rgba(248,113,113,0.1); border-radius: 6px; border: 1px solid rgba(248,113,113,0.2); }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔒 Dashboard</h1>
    <p class="sub">Sign in to continue.</p>
    <div class="err" id="err">Invalid email or password. Try again.</div>
    <form id="f">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="ericphan28@gmail.com" required autofocus>
      <label for="pw">Password</label>
      <input type="password" id="pw" placeholder="••••••••" required>
      <button type="submit" id="btn">Login</button>
    </form>
  </div>
  <script>
    document.getElementById('f').addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = document.getElementById('btn');
      var err = document.getElementById('err');
      var email = document.getElementById('email').value.trim();
      var pw = document.getElementById('pw').value;
      err.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Signing in...';
      try {
        var res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: pw })
        });
        var data = await res.json();
        if (data.success) {
          window.location.href = decodeURIComponent('${redirectTo}');
        } else {
          err.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Login';
        }
      } catch(ex) {
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    });
  </script>
</body>
</html>`;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
