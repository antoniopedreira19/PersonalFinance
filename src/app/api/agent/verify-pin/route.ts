import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const agentKey = request.headers.get('x-agent-key');
    if (agentKey !== process.env.AGENT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Agent Key' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, pin } = body;

    if (!phone || !pin) {
      return NextResponse.json({ error: 'Phone and PIN are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('agent_phone_links')
      .select('user_id, pin')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Phone not found or linked' }, { status: 404 });
    }

    const isValid = bcrypt.compareSync(pin, data.pin);

    if (isValid) {
      return NextResponse.json({ valid: true, userId: data.user_id });
    } else {
      return NextResponse.json({ valid: false, error: 'Invalid PIN' }, { status: 401 });
    }

  } catch (error) {
    console.error('Agent Verify PIN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}