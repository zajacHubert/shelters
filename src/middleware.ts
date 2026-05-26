import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'shelter_session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const from = request.nextUrl.pathname;
    return NextResponse.redirect(new URL(`/login?from=${from}`, request.url));
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const from = request.nextUrl.pathname;
    return NextResponse.redirect(new URL(`/login?from=${from}`, request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
