import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  // Do not execute Supabase Client if keys are completely missing during build time
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch user profile for role and approval status
  let profile = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single();
    profile = profileData;
  }

  const pathname = request.nextUrl.pathname;

  // 2. Protect Admin Route
  if (pathname.startsWith('/admin')) {
    if (!user || profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. Handle Dashboard Access & Approval
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // If not approved, redirect to a "Waiting" page (except if they are Super Admin)
    if (!profile?.is_approved && profile?.role !== 'super_admin' && pathname !== '/dashboard/pending') {
        return NextResponse.redirect(new URL('/dashboard/pending', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
