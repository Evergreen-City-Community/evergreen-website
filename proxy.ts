import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// People type the quiz address in any capitalisation (/BibleQuiz, /Biblequiz).
// The page lives at /biblequiz, so send every other spelling there. This only
// runs for that one address, so the rest of the site is untouched.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/biblequiz") {
    const url = request.nextUrl.clone();
    url.pathname = "/biblequiz";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// The matcher is case-sensitive, so each letter lists both cases.
export const config = { matcher: "/:slug([Bb][Ii][Bb][Ll][Ee][Qq][Uu][Ii][Zz])" };
