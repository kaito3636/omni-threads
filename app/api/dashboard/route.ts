import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const [{ data: posts }, { data: follows }] = await Promise.all([
    supabase.from('posts_log').select('*').order('posted_at', { ascending: false }).limit(500),
    supabase.from('line_follows').select('*').order('followed_at', { ascending: false }).limit(500),
  ])
  return NextResponse.json({ posts: posts ?? [], follows: follows ?? [] })
}
