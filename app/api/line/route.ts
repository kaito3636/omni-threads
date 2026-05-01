import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('x-line-signature') ?? ''
  const secret = process.env.LINE_CHANNEL_SECRET ?? ''

  // 署名検証
  const expected = createHmac('sha256', secret).update(body).digest('base64')
  if (sig !== expected) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const { events } = JSON.parse(body) as { events: any[] }

  for (const ev of events) {
    if (ev.type === 'follow') {
      await supabase.from('line_follows').insert({
        line_user_id: ev.source?.userId ?? null,
        followed_at: new Date(ev.timestamp).toISOString(),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
