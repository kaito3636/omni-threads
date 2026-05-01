'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, LabelList,
} from 'recharts'

/* ── Types ─────────────────────────────────────────────── */
type PostType =
  | '❶まとめ系'
  | '❷ツリー型'
  | '❸否定型'
  | '❹エンゲージ型'
  | '❺権威性型'
  | '❻リアルタイム型'

interface Post {
  id: string
  posted_at: string
  account: string
  post_index: number
  post_type: PostType
  preview: string
}

interface Follow {
  id: string
  followed_at: string
  line_user_id: string | null
}

/* ── Config ─────────────────────────────────────────────── */
const POST_CONFIG: Record<string, { label: string; color: string }> = {
  '❶まとめ系':      { label: 'まとめ系',      color: '#6366f1' },
  '❷ツリー型':      { label: 'ツリー型',      color: '#0ea5e9' },
  '❸否定型':        { label: '否定型',        color: '#f59e0b' },
  '❹エンゲージ型':  { label: 'エンゲージ型',  color: '#10b981' },
  '❺権威性型':      { label: '権威性型',      color: '#8b5cf6' },
  '❻リアルタイム型':{ label: 'リアルタイム型', color: '#ef4444' },
}
const POST_ORDER = Object.keys(POST_CONFIG) as PostType[]

/* ── Sparkline ───────────────────────────────────────────── */
function Spark({ color, seed }: { color: string; seed: number }) {
  const pts = useMemo(() => {
    let s = seed
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
    return Array.from({ length: 14 }, () => 0.25 + r() * 0.75)
  }, [seed])
  const W = 70, H = 22
  const max = Math.max(...pts)
  const path = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * W
    const y = H - (v / max) * H
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const id = `sg_${seed}`
  return (
    <svg className="overflow-visible" width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  )
}

/* ── KPI Card ────────────────────────────────────────────── */
function KpiCard({ label, value, color, sparkSeed, sub }: {
  label: string; value: number; color: string; sparkSeed: number; sub?: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-[18px] pb-4 transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 60%), #0c0d12',
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit]"
        style={{
          padding: 1,
          background: `linear-gradient(160deg, color-mix(in oklch, ${color} 70%, transparent) 0%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.02) 100%)`,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute z-0"
        style={{
          top: '-40%', right: '-30%', width: 180, height: 180,
          background: `radial-gradient(circle, color-mix(in oklch, ${color} 60%, transparent) 0%, transparent 65%)`,
          filter: 'blur(20px)', opacity: 0.55,
        }}
      />
      <div className="relative z-[2] mb-[22px] flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7c8194]">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-lg text-xs"
          style={{
            background: `color-mix(in oklch, ${color} 14%, transparent)`,
            border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
            color,
            boxShadow: `0 0 18px -4px color-mix(in oklch, ${color} 50%, transparent)`,
          }}>●</span>
      </div>
      <div className="relative z-[2] mono text-[36px] font-bold leading-none tracking-tight text-white"
        style={{ textShadow: `0 0 22px color-mix(in oklch, ${color} 30%, transparent)` }}>
        {value.toLocaleString('ja-JP')}
      </div>
      <div className="relative z-[2] mt-[14px] flex items-center justify-between mono text-[11px] text-[#4d5266]">
        <span style={{ color: '#6ee7b7' }}>{sub ?? '累計'}</span>
        <Spark color={color} seed={sparkSeed} />
      </div>
    </div>
  )
}

/* ── Chart Tooltip ───────────────────────────────────────── */
const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { color: string; name: string; value: number } }[] }) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-[10px] border border-white/[0.08] px-3 py-2 mono text-xs text-[#f4f5f8]"
      style={{ background: 'rgba(12,13,18,0.96)', boxShadow: `0 8px 24px -8px ${p.color}` }}>
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-sm" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
        <span className="text-[11px] text-[#c5c8d2]">{p.name}</span>
      </div>
      <div className="text-[18px] font-semibold text-white">{p.value.toLocaleString()}</div>
    </div>
  )
}

/* ── Correlation logic ───────────────────────────────────── */
function correlate(posts: Post[], follows: Follow[], lagHours = 6) {
  const map: Record<string, number> = {}
  for (const f of follows) {
    const ft = new Date(f.followed_at).getTime()
    const windowStart = ft - lagHours * 3600 * 1000
    for (const p of posts) {
      const pt = new Date(p.posted_at).getTime()
      if (pt >= windowStart && pt <= ft) map[p.post_type] = (map[p.post_type] ?? 0) + 1
    }
  }
  return map
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ── Main Dashboard ──────────────────────────────────────── */
export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [follows, setFollows] = useState<Follow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error(String(res.status))
        const { posts, follows } = await res.json()
        if (!cancelled) {
          setPosts(posts)
          setFollows(follows)
          setLastUpdated(Date.now())
        }
      } catch { /* keep last good data */ } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000)), 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  const { typeCounts, corrMap, chartData, totalPosts, totalFollows, todayPosts, todayFollows } = useMemo(() => {
    const typeCounts: Record<string, number> = {}
    for (const p of posts) typeCounts[p.post_type] = (typeCounts[p.post_type] ?? 0) + 1

    const corrMap = correlate(posts, follows)

    const chartData = POST_ORDER.map((t) => ({
      key: t,
      name: POST_CONFIG[t]?.label ?? t,
      value: typeCounts[t] ?? 0,
      color: POST_CONFIG[t]?.color ?? '#888',
    }))

    const today = new Date().toISOString().slice(0, 10)
    const todayPosts = posts.filter(p => p.posted_at.slice(0, 10) === today).length
    const todayFollows = follows.filter(f => f.followed_at.slice(0, 10) === today).length

    return { typeCounts, corrMap, chartData, totalPosts: posts.length, totalFollows: follows.length, todayPosts, todayFollows }
  }, [posts, follows])

  const totalCorr = Object.values(corrMap).reduce((a, b) => a + b, 0)
  const totalEvents = chartData.reduce((s, d) => s + d.value, 0)

  type TimelineItem =
    | { kind: 'post'; key: string; time: string; account: string; post_type: string; preview: string }
    | { kind: 'follow'; key: string; time: string; line_user_id: string | null }

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [
      ...posts.slice(0, 50).map(p => ({
        kind: 'post' as const, key: p.id, time: p.posted_at,
        account: p.account, post_type: p.post_type, preview: p.preview,
      })),
      ...follows.slice(0, 50).map(f => ({
        kind: 'follow' as const, key: f.id, time: f.followed_at,
        line_user_id: f.line_user_id,
      })),
    ]
    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 60)
  }, [posts, follows])

  const todayStr = useMemo(() =>
    new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }), [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07080b] font-sans text-[#f4f5f8] antialiased">
      {/* Atmospheric backgrounds */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(1200px 600px at 15% -10%, rgba(99,102,241,0.10), transparent 60%),' +
            'radial-gradient(900px 500px at 95% 0%, rgba(139,92,246,0.08), transparent 60%),' +
            'radial-gradient(800px 600px at 50% 110%, rgba(16,185,129,0.05), transparent 60%)',
        }}
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 100% 80% at 50% 0%, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 80% at 50% 0%, black 30%, transparent 90%)',
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1480px] px-4 pb-16 pt-7 md:px-8">

        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div className="flex items-center gap-3.5">
            <div className="relative h-[38px] w-[38px] rounded-[10px] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(99,102,241,0.4)]"
              style={{ background: 'conic-gradient(from 210deg at 50% 50%, #6366f1, #8b5cf6, #ef4444, #f59e0b, #10b981, #0ea5e9, #6366f1)' }}>
              <div className="absolute inset-[6px] rounded-md bg-[#07080b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
              <div className="absolute inset-0 z-[2] grid place-items-center text-base font-extrabold text-white" style={{ textShadow: '0 0 12px rgba(255,255,255,0.4)' }}>占</div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-bold uppercase tracking-[0.18em] text-white">OMNI-THREADS</span>
              <span className="mt-[3px] text-[11px] uppercase tracking-[0.12em] text-[#7c8194]">Threads × LINE 相関分析</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#11131a] px-3 py-[7px] mono text-[11px] text-[#c5c8d2]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              最終更新 <span className="text-white">{secondsAgo}</span>秒前
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] py-[7px] pl-2.5 pr-3 mono text-[11px] tracking-[0.06em] text-emerald-300">
              <span className="pulse-dot h-[7px] w-[7px] rounded-full bg-emerald-500" />
              LIVE · 30s POLL
            </div>
          </div>
        </div>

        {/* Page head */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mono text-[11px] uppercase tracking-[0.1em] text-[#4d5266]">
              DASHBOARD <span className="text-[#4d5266]">/</span> <b className="font-semibold text-[#c5c8d2]">OVERVIEW</b>
            </div>
            <h1 className="mt-2 text-[30px] font-bold tracking-tight text-white">
              スレッド×LINE
              <span className="bg-gradient-to-r from-white via-purple-300 to-blue-400 bg-clip-text text-transparent"> 分析</span>
            </h1>
            <p className="mt-1.5 text-[13px] text-[#7c8194]">投稿タイプ × LINE登録タイミング の相関を一画面で。</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-[#4d5266]">SESSION DATE</span>
            <span className="mono text-[13px] text-[#c5c8d2]">{todayStr}</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <KpiCard label="総投稿数"    value={totalPosts}   color="#6366f1" sparkSeed={101} sub="全期間" />
          <KpiCard label="LINE登録"    value={totalFollows} color="#10b981" sparkSeed={207} sub="全期間" />
          <KpiCard label="今日の投稿"  value={todayPosts}   color="#0ea5e9" sparkSeed={313} sub="本日" />
          <KpiCard label="今日の登録"  value={todayFollows} color="#8b5cf6" sparkSeed={419} sub="本日" />
        </div>

        {/* Chart + correlation */}
        <div className="mb-3.5 grid gap-3.5 lg:grid-cols-[1.7fr_1fr]">
          {/* Bar chart */}
          <div className="relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#0c0d12] p-6">
            <div className="mb-4 flex items-baseline gap-2.5">
              <h2 className="text-sm font-semibold tracking-wide text-white">投稿型別件数</h2>
              <span className="mono text-[11px] tracking-wide text-[#4d5266]">// POST_VOLUME_BY_TYPE</span>
            </div>
            <div className="relative -mx-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
                  <defs>
                    {chartData.map((d) => (
                      <linearGradient key={d.key} id={`bar_${d.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={d.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={d.color} stopOpacity={0.35} />
                      </linearGradient>
                    ))}
                    <filter id="barglow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="b" />
                      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#7c8194', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4d5266', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" radius={[10, 10, 4, 4]} maxBarSize={56} filter="url(#barglow)">
                    {chartData.map((d) => (
                      <Cell key={d.key} fill={`url(#bar_${d.key})`} stroke={d.color} strokeOpacity={0.5} strokeWidth={1} />
                    ))}
                    <LabelList dataKey="value" position="top" fill="#f4f5f8" fontSize={11} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-[18px] gap-y-3.5 border-t border-dashed border-white/[0.06] pt-4">
              {chartData.map((d) => (
                <div key={d.key} className="flex items-center gap-2 text-[12px] text-[#c5c8d2]">
                  <span className="h-[9px] w-[9px] rounded-[3px]"
                    style={{ background: d.color, boxShadow: `0 0 8px color-mix(in oklch, ${d.color} 70%, transparent)` }} />
                  <span>{d.name}</span>
                  <span className="ml-auto mono text-[11px] text-[#7c8194]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Correlation */}
          <div className="relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#0c0d12] p-6">
            <div className="mb-4 flex items-baseline gap-2.5">
              <h2 className="text-sm font-semibold tracking-wide text-white">投稿→LINE相関</h2>
              <span className="mono text-[11px] tracking-wide text-[#4d5266]">// 6h以内</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {POST_ORDER.map((t) => {
                const count = corrMap[t] ?? 0
                const pct = totalCorr ? (count / totalCorr) * 100 : 0
                const color = POST_CONFIG[t]?.color ?? '#888'
                return (
                  <div key={t} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="flex min-w-[110px] items-center gap-2 text-[12px] text-[#c5c8d2]">
                      <span className="h-2 w-2 rounded-full"
                        style={{ background: color, boxShadow: `0 0 10px color-mix(in oklch, ${color} 80%, transparent)` }} />
                      {POST_CONFIG[t]?.label}
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                      <span className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: pct + '%',
                          background: `linear-gradient(90deg, color-mix(in oklch, ${color} 50%, transparent) 0%, ${color} 100%)`,
                          boxShadow: `0 0 12px -2px ${color}`,
                        }} />
                    </div>
                    <div className="min-w-[40px] text-right mono text-[12px] text-white">{count}件</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3.5 border-t border-dashed border-white/[0.06] pt-[18px]">
              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-[#4d5266]">相関ヒット</div>
                <div className="mono text-[22px] font-semibold tabular-nums">{totalCorr}</div>
              </div>
              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-[#4d5266]">LINE→投稿CVR</div>
                <div className="mono text-[22px] font-semibold tabular-nums">
                  {totalPosts ? ((totalFollows / totalPosts) * 100).toFixed(1) : '0.0'}
                  <span className="text-[12px] text-[#4d5266]">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-3.5 overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#0c0d12]">
          <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-[22px]">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-sm font-semibold tracking-wide text-white">タイムライン</h2>
              <span className="mono text-[11px] tracking-wide text-[#4d5266]">// 投稿 + LINE登録 統合</span>
            </div>
            <span className="mono text-[11px] text-[#4d5266]">{timeline.length} / {posts.length + follows.length} shown</span>
          </div>

          <div className="px-6 pb-6">
            <div className="overflow-hidden rounded-[14px] border border-white/[0.06]">
              <div className="grid h-9 items-center gap-3.5 border-b border-white/[0.06] bg-[#11131a] px-[18px] mono text-[10px] uppercase tracking-[0.14em] text-[#4d5266]"
                style={{ gridTemplateColumns: '12px 120px 140px 1fr 1.4fr' }}>
                <span />
                <span>TIME</span>
                <span>TYPE</span>
                <span>ACCOUNT / LINE</span>
                <span className="hidden md:inline">PREVIEW</span>
              </div>
              {loading && timeline.length === 0 ? (
                <div className="px-[18px] py-12 text-center mono text-xs text-[#4d5266]">Loading…</div>
              ) : timeline.length === 0 ? (
                <div className="px-[18px] py-12 text-center mono text-xs text-[#4d5266]">データなし</div>
              ) : (
                timeline.map((item) => {
                  if (item.kind === 'post') {
                    const color = POST_CONFIG[item.post_type]?.color ?? '#888'
                    const label = POST_CONFIG[item.post_type]?.label ?? item.post_type
                    return (
                      <div key={item.key}
                        className="grid h-11 items-center gap-3.5 border-b border-white/[0.06] px-[18px] text-[13px] text-[#c5c8d2] last:border-0 hover:bg-white/[0.02]"
                        style={{ gridTemplateColumns: '12px 120px 140px 1fr 1.4fr' }}>
                        <span className="h-2 w-2 rounded-full"
                          style={{ background: color, boxShadow: `0 0 10px color-mix(in oklch, ${color} 90%, transparent)` }} />
                        <span className="mono text-[12px] tabular-nums text-[#7c8194]">{fmtTime(item.time)}</span>
                        <span className="inline-flex h-[22px] w-fit items-center rounded-md px-[9px] text-[11px] font-semibold"
                          style={{
                            background: `color-mix(in oklch, ${color} 14%, transparent)`,
                            border: `1px solid color-mix(in oklch, ${color} 28%, transparent)`,
                            color,
                          }}>
                          {label}
                        </span>
                        <span className="truncate text-[13px] font-medium text-white">
                          <span className="text-[#4d5266]">@</span>{item.account}
                        </span>
                        <span className="hidden truncate text-[12.5px] text-[#7c8194] md:inline">{item.preview}</span>
                      </div>
                    )
                  } else {
                    return (
                      <div key={item.key}
                        className="grid h-11 items-center gap-3.5 border-b border-white/[0.06] px-[18px] text-[13px] text-[#c5c8d2] last:border-0 hover:bg-white/[0.02]"
                        style={{ gridTemplateColumns: '12px 120px 140px 1fr 1.4fr' }}>
                        <span className="h-2 w-2 rounded-full"
                          style={{ background: '#10b981', boxShadow: '0 0 10px color-mix(in oklch, #10b981 90%, transparent)' }} />
                        <span className="mono text-[12px] tabular-nums text-[#7c8194]">{fmtTime(item.time)}</span>
                        <span className="inline-flex h-[22px] w-fit items-center rounded-md px-[9px] text-[11px] font-semibold"
                          style={{
                            background: 'color-mix(in oklch, #10b981 14%, transparent)',
                            border: '1px solid color-mix(in oklch, #10b981 28%, transparent)',
                            color: '#10b981',
                          }}>
                          LINE登録
                        </span>
                        <span className="mono text-[12px] text-[#64748b]">{item.line_user_id?.slice(0, 20) ?? '—'}</span>
                        <span className="hidden text-[12px] text-[#4d5266] md:inline">友だち追加</span>
                      </div>
                    )
                  }
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
