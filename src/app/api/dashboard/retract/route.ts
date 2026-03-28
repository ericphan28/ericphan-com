import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readFileSync } from 'fs';
import path from 'path';

const USER_ID = 89813476;
const COOKIE_FILE = path.join(process.cwd(), '..', 'freelancer-com', 'cookies.json');

function getFreelancerHeaders() {
  const cookieData = JSON.parse(readFileSync(COOKIE_FILE, 'utf8'));
  const authHash = cookieData.find((c: { name: string; value: string }) => c.name === 'GETAFREE_AUTH_HASH_V2')?.value;
  if (!authHash) throw new Error('Auth hash not found');
  return {
    'freelancer-auth-v2': `${USER_ID};${authHash}`,
    'freelancer-app-name': 'main',
    'freelancer-app-platform': 'web',
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

export async function POST(req: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get('dashboard_token')?.value;
  if (token !== process.env.DASHBOARD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bidId } = await req.json();
  if (!bidId) return NextResponse.json({ error: 'bidId required' }, { status: 400 });

  try {
    const headers = getFreelancerHeaders();
    const resp = await fetch(`https://www.freelancer.com/api/projects/0.1/bids/${bidId}/`, {
      method: 'PUT',
      headers,
      body: 'action=retract',
    });
    const data = await resp.json();

    if (data.status === 'success' || data.result) {
      return NextResponse.json({ success: true });
    } else {
      const msg = data.message || data.error?.message || JSON.stringify(data);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
