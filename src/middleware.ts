import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user, role } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // לא מחובר → רק מסכים ציבוריים
  if (!user) {
    if (isPublic) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // מחובר אבל אין role → trigger עוד לא רץ. ננסה שוב במסך login
  if (!role) {
    if (pathname === "/login") return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // root redirect
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = role === "teacher" ? "/teacher" : "/parent";
    return NextResponse.redirect(url);
  }

  // login כשמחובר → לאזור שלך (מנקים query params כדי לא לגרור ?error=auth)
  if (pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = role === "teacher" ? "/teacher" : "/parent";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // הורה לא יכול להיכנס לאזור המורה
  if (pathname.startsWith("/teacher") && role !== "teacher") {
    const url = request.nextUrl.clone();
    url.pathname = "/parent";
    return NextResponse.redirect(url);
  }

  // מורה מנסה להיכנס לאזור הורה → ל-dashboard שלה
  if (pathname.startsWith("/parent") && role !== "parent") {
    const url = request.nextUrl.clone();
    url.pathname = "/teacher";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * הפעלת middleware בכל הנתיבים מלבד:
     * - _next/static, _next/image
     * - favicon, manifest, אייקונים, sw
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
