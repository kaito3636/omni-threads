import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { account, post_index, post_type, preview, posted_at } = await req.json()

  const { error } = await supabase.from('posts_log').insert({
    account,
    post_index,
    post_type,
    preview,
    posted_at: posted_at ?? new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
