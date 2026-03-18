import { cookies } from 'next/headers';

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!body.password || body.password.length === 0) {
    return Response.json({ error: 'Password is required' }, { status: 400 });
  }

  // Veneer auth: accept any non-empty password
  cookies().set('admin_session', 'demo', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return Response.json({ success: true });
}
