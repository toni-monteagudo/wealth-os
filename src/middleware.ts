export { default } from "next-auth/middleware";

export const config = {
    // Require auth for all routes except login, api routes, and static Next.js assets
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth endpoints)
         * - login (the sign in page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
    ],
};
