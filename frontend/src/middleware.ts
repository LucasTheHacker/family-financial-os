import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("sb-token")?.value;
  const { pathname } = request.nextUrl;

  // Determine if it is a request for the login page
  const isLoginPage = pathname === "/login";

  // If user is NOT authenticated and is trying to access a protected page, redirect to /login
  if (!token && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    // Preserving the original requested URL as a query param is useful, but simple redirect is requested.
    return NextResponse.redirect(loginUrl);
  }

  // If user IS authenticated and is trying to access the login page, redirect to home page
  if (token && isLoginPage) {
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Config to run the middleware on all application routes except static files
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
