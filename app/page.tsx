import { supabase } from '@/lib/supabase'

type Post = {
  id: string
  posted_at: string
  account: string
  post_type: string
  preview: string
}

type Follow = {
  id: string
  followed_at: string
  line_user_id: string | null
}

const TYPE_COLOR: Record<string, string> = {
  '❶まとめ系':      '#6366f1',
  '❷ツリー型':      '#0ea5e9',
  '❸否定型':        '#f59e0b',
  '❹エンゲージ型':  '#10b981',
  '❺権威性型':      '#8b5cf6',
  '❻リアルタイム型':'#ef4444',
}

function badge(type: string) {
  const color = TYPE_COLOR[type] ?? '#6b7280'
  return (
    <span style={{
      background: color, color: '#fff', fontSize: 11,
      padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap',
    }}>{type}</span>
  )
}

function fmt(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function correlate(posts: Post[], follows: Follow[], lagHours = 6) {
  const map: Record<string, number> = {}
  for (const f of follows) {
    const ft = new Date(f.followed_at).getTime()
    const windowStart = ft - lagHours * 3600 * 1000
    for (const p of posts) {
      const pt = new Date(p.posted_at).getTime()
      if (pt >= windowStart && pt <= ft) {
        map[p.post_type] = (map[p.post_type] ?? 0) + 1
      }
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

function dayCount(items: { date: string }[]) {
  const map: Record<string, number> = {}
  for (const { date } of items) {
    map[date] = (map[date] ?? 0) + 1
  }
  return Object.entries(map).sort()
}

export const revalidate = 60

export default async function Dashboard() {
  const [{ data: posts }, { data: follows }] = await Promise.all([
    supabase.from('posts_log').select('*').order('posted_at', { ascending: false }).limit(200),
    supabase.from('line_follows').select('*').order('followed_at', { ascending: false }).limit(500),
  ])

  const p = (posts ?? []) as Post[]
  const f = (follows ?? []) as Follow[]

  const corr = correlate(p, f)
  const postsByDay = dayCount(p.map(x => ({ date: x.posted_at.slice(0,10) })))
  const followsByDay = dayCount(f.map(x => ({ date: x.followed_at.slice(0,10) })))

  const typeStats: Record<string, number> = {}
  for (const post of p) typeStats[post.post_type] = (typeStats[post.post_type] ?? 0) + 1

  const s: Record<string, React.CSSProperties> = {
    root: { fontFamily: 'system-ui,sans-serif', background: '#0f1117', color: '#e2e8f0', minHeight: '100vh', padding: '24px 20px' },
    h1: { fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#fff' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 24 },
    card: { background: '#1e2130', borderRadius: 12, padding: 20 },
    cardTitle: { fontSize: 12, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
    bigNum: { fontSize: 36, fontWeight: 700, color: '#fff' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2d3348' },
    tag: { fontSize: 11, color: '#94a3b8' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 12 },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
    th: { textAlign: 'left' as const, padding: '8px 10px', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #2d3348' },
    td: { padding: '8px 10px', borderBottom: '1px solid #1e2130', verticalAlign: 'top' as const },
  }

  return (
    <div style={s.root}>
      <h1 style={s.h1}>omni-threads ダッシュボード</h1>

      {/* KPIカード */}
      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.cardTitle}>総投稿数</div>
          <div style={s.bigNum}>{p.length}</div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>LINE登録数</div>
          <div style={s.bigNum}>{f.length}</div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>投稿→LINE相関（6h以内）</div>
          <div style={s.bigNum}>{corr.reduce((a,[,n])=>a+n,0)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* 投稿型別 */}
        <div style={s.card}>
          <div style={s.cardTitle}>投稿型別件数</div>
          {Object.entries(typeStats).sort((a,b)=>b[1]-a[1]).map(([type, count]) => (
            <div key={type} style={s.row}>
              {badge(type)}
              <span style={{ fontWeight: 600 }}>{count}件</span>
            </div>
          ))}
          {Object.keys(typeStats).length === 0 && <div style={s.tag}>データなし</div>}
        </div>

        {/* 相関分析 */}
        <div style={s.card}>
          <div style={s.cardTitle}>投稿後6h以内のLINE登録（型別）</div>
          {corr.map(([type, count]) => (
            <div key={type} style={s.row}>
              {badge(type)}
              <span style={{ fontWeight: 600 }}>{count}件</span>
            </div>
          ))}
          {corr.length === 0 && <div style={s.tag}>データが足りません</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* 日別投稿数 */}
        <div style={s.card}>
          <div style={s.cardTitle}>日別投稿数</div>
          {postsByDay.slice(-14).map(([day, count]) => (
            <div key={day} style={s.row}>
              <span style={s.tag}>{day}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: '#6366f1', height: 8, width: count * 12, borderRadius: 4, maxWidth: 120 }} />
                <span style={{ fontWeight: 600, minWidth: 24 }}>{count}</span>
              </div>
            </div>
          ))}
          {postsByDay.length === 0 && <div style={s.tag}>データなし</div>}
        </div>

        {/* 日別LINE登録 */}
        <div style={s.card}>
          <div style={s.cardTitle}>日別LINE登録数</div>
          {followsByDay.slice(-14).map(([day, count]) => (
            <div key={day} style={s.row}>
              <span style={s.tag}>{day}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: '#10b981', height: 8, width: count * 12, borderRadius: 4, maxWidth: 120 }} />
                <span style={{ fontWeight: 600, minWidth: 24 }}>{count}</span>
              </div>
            </div>
          ))}
          {followsByDay.length === 0 && <div style={s.tag}>データなし</div>}
        </div>
      </div>

      {/* 最近の投稿ログ */}
      <div style={{ ...s.card, ...s.section }}>
        <div style={s.sectionTitle}>最近の投稿ログ</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>日時</th>
              <th style={s.th}>アカウント</th>
              <th style={s.th}>型</th>
              <th style={s.th}>内容プレビュー</th>
            </tr>
          </thead>
          <tbody>
            {p.slice(0, 30).map(post => (
              <tr key={post.id}>
                <td style={{ ...s.td, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmt(post.posted_at)}</td>
                <td style={{ ...s.td, color: '#94a3b8' }}>@{post.account}</td>
                <td style={s.td}>{badge(post.post_type)}</td>
                <td style={{ ...s.td, color: '#cbd5e1' }}>{post.preview}</td>
              </tr>
            ))}
            {p.length === 0 && (
              <tr><td colSpan={4} style={{ ...s.td, color: '#64748b', textAlign: 'center' }}>投稿ログなし</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 最近のLINE登録 */}
      <div style={{ ...s.card, ...s.section }}>
        <div style={s.sectionTitle}>最近のLINE登録</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>登録日時</th>
              <th style={s.th}>ユーザーID</th>
            </tr>
          </thead>
          <tbody>
            {f.slice(0, 20).map(follow => (
              <tr key={follow.id}>
                <td style={{ ...s.td, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmt(follow.followed_at)}</td>
                <td style={{ ...s.td, color: '#64748b', fontSize: 12 }}>{follow.line_user_id ?? '—'}</td>
              </tr>
            ))}
            {f.length === 0 && (
              <tr><td colSpan={2} style={{ ...s.td, color: '#64748b', textAlign: 'center' }}>LINE登録なし</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
