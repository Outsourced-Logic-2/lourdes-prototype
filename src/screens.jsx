import React, { useState, useEffect, useRef, useMemo } from 'react'
import { T } from './theme'
import { Icon, Btn, StatusBadge, Pill, Mono, Label, TextField, TextArea, Select, FieldRow, PageHeader, DeIdStrip } from './ui'
import { MODES, INSURERS, LEVELS, CRITERIA, SETTINGS, SAMPLES, cannedAppeal, cannedNote, cannedP2P, renderInline, plainText, useStreamReveal } from './data.jsx'


// ═══════════════════════════════════════════════════════════════════════════
// Shared row primitives
// ═══════════════════════════════════════════════════════════════════════════

// Format the seed-style 'when' strings: today → time only, yesterday → date,
// other days → date only (strip the time).
const formatWhen = (when) => {
  if (!when) return '';
  if (when.startsWith('Today · ')) return when.slice('Today · '.length);
  if (when.startsWith('Yesterday · ')) return 'May 17';
  // e.g. "May 16 · 1:15 PM" → "May 16"
  return when.split(' · ')[0];
};

const CaseRow = ({ row, onClick, dense, showClaimId = true, showStatus = true }) =>
<div
  onClick={onClick}
  className="row-hover"
  style={{
    display: 'grid',
    gridTemplateColumns: showClaimId ?
    '24px 92px 1fr 120px 100px 14px' :
    '24px 1fr 120px 100px 14px',
    gap: 14,
    alignItems: 'center',
    padding: dense ? '10px 18px' : '13px 18px',
    borderBottom: `1px solid ${T.line2}`,
    fontSize: 12.5,
    cursor: 'pointer'
  }}>
  
    <Icon k={row.icon} size={14} color={T.ink3} />
    {showClaimId &&
  <Mono style={{ color: T.ink3, fontSize: 11, letterSpacing: -0.1 }}>{row.claimId || '—'}</Mono>
  }
    <div style={{ color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 450 }}>{row.preview}</div>
    {showStatus ? <StatusBadge status={row.status || 'draft'} small /> : <Mono style={{ fontSize: 11, color: T.ink3 }}>{row.when}</Mono>}
    <Mono style={{ color: T.ink3, fontSize: 11, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatWhen(row.when)}</Mono>
    <Icon k="chevron" size={13} color={T.ink4} />
  </div>;


const SectionHead = ({ title, subtitle, right }) =>
<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, letterSpacing: -0.1 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>{subtitle}</div>}
    </div>
    {right}
  </div>;


const Card = ({ children, style, pad = 18 }) =>
<div style={{
  background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10,
  padding: pad,
  boxShadow: '0 1px 0 rgba(15,23,42,0.02)',
  ...style
}}>{children}</div>;


// ═══════════════════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════════════════

// Top-right “go to” affordance that lives on every clickable card.
const OpenBadge = ({ tone = 'neutral' }) => {
  const tones = {
    neutral: { bg: T.paper2, fg: T.ink2, br: T.line },
    urgent: { bg: '#fee2e2', fg: T.urgent, br: '#fca5a5' },
    pending: { bg: T.pendSoft, fg: T.pending, br: T.pendBor },
    draft: { bg: T.paper3, fg: T.ink2, br: T.line },
    brand: { bg: T.brandSoft, fg: T.brand, br: '#bdd4f0' }
  };
  const c = tones[tone] || tones.neutral;
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12,
      width: 28, height: 28, borderRadius: 7,
      background: c.bg, color: c.fg, border: `1px solid ${c.br}`,
      display: 'grid', placeItems: 'center'
    }}>
      <Icon k="arrowOut" size={14} />
    </div>);

};

const ModeCard = ({ mode, onClick, hint }) =>
<div
  onClick={onClick}
  className="card-hover"
  style={{
    flex: 1,
    border: `1px solid ${T.line}`,
    borderRadius: 10,
    padding: 22,
    paddingRight: 56,
    background: T.paper,
    display: 'flex', flexDirection: 'column', gap: 14,
    minHeight: 160,
    cursor: 'pointer',
    position: 'relative',
    boxShadow: '0 1px 0 rgba(15,23,42,0.02)'
  }}>
  
    <OpenBadge tone="brand" />
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
      width: 42, height: 42, borderRadius: 9, background: T.brandSoft,
      display: 'grid', placeItems: 'center', color: T.brand,
      border: `1px solid #cfe0f3`
    }}>
        <Icon k={mode.icon} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: -0.2 }}>{mode.title}</div>
        {hint && <div style={{ fontSize: 10.5, color: T.ink3, fontFamily: T.mono, marginTop: 2, letterSpacing: 0.3 }}>{hint}</div>}
      </div>
    </div>
    <div style={{ fontSize: 13, color: T.ink3, lineHeight: 1.55 }}>{mode.blurb}</div>
  </div>;


const QueueTile = ({ icon, label, count, tone, onClick }) => {
  const tones = {
    urgent: { bg: '#fee2e2', fg: T.urgent, br: '#fca5a5' },
    pending: { bg: T.pendSoft, fg: T.pending, br: T.pendBor },
    draft: { bg: T.paper3, fg: T.ink3, br: T.line }
  };
  const c = tones[tone] || tones.pending;
  return (
    <div onClick={onClick} className="card-hover" style={{
      flex: 1, padding: '14px 56px 14px 16px',
      background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      boxShadow: '0 1px 0 rgba(15,23,42,0.02)',
      position: 'relative'
    }}>
      <OpenBadge tone={tone} />
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: c.bg, color: c.fg, border: `1px solid ${c.br}`,
        display: 'grid', placeItems: 'center'
      }}>
        <Icon k={icon} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: T.ink, fontWeight: 500, letterSpacing: -0.1 }}>{label}</div>
        <div style={{ fontSize: 11, color: T.ink3, fontFamily: T.mono, marginTop: 1, letterSpacing: 0.3, textTransform: 'uppercase' }}>{count === 1 ? '1 case' : `${count} cases`}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: c.fg, letterSpacing: -0.5 }}>{count}</div>
    </div>);

};

const Home = ({ history, onPickMode, onOpenHistory, onOpenHistoryFiltered, onOpenItem }) => {
  const urgentItems = history.filter((h) => h.status === 'urgent' || h.status === 'filed' || h.status === 'pending').slice(0, 4);
  const activeQueue = history.filter((h) => h.status === 'filed' || h.status === 'pending' || h.status === 'urgent').slice(0, 6);
  const completed = history.filter((h) => h.status === 'approved' || h.status === 'overturned' || h.status === 'denied').slice(0, 6);

  const deadlineCount = history.filter((h) => h.status === 'urgent').length;
  const pendingCount = history.filter((h) => h.status === 'filed' || h.status === 'pending').length;
  const draftCount = history.filter((h) => h.status === 'draft').length;

  return (
    <div className="screen" style={{ padding: '28px 32px 40px', display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto', width: '100%' }}>

      {/* Inline header (replaces the top white bar) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: T.ink3, fontFamily: T.mono, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>Sunday · May 18, 2026</div>
          <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: -0.6, color: T.ink, fontFamily: T.serif, fontVariationSettings: '"opsz" 36' }}>Good morning, Maria</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6,
            padding: '0 12px', height: 36, width: 260,
            color: T.ink3, fontSize: 12.5
          }}>
            <Icon k="search" size={14} color={T.ink3} />
            <input
              placeholder="Search cases, ICD-10, insurers…"
              style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 12.5, color: T.ink, fontFamily: T.sans }} />
            
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: 6,
            background: T.paper, border: `1px solid ${T.line}`,
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            position: 'relative'
          }}>
            <Icon k="bell" size={15} color={T.ink2} />
            <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: T.urgent, border: `1.5px solid ${T.paper}` }} />
          </button>
        </div>
      </div>

      {/* Queue tiles (clickable) */}
      <div style={{ display: 'flex', gap: 14 }}>
        <QueueTile icon="alert" label="Deadline soon" count={deadlineCount} tone="urgent" onClick={() => onOpenHistoryFiltered('urgent')} />
        <QueueTile icon="clock" label="Awaiting decision" count={pendingCount} tone="pending" onClick={() => onOpenHistoryFiltered('filed')} />
        <QueueTile icon="doc" label="Drafts" count={draftCount} tone="draft" onClick={() => onOpenHistoryFiltered('draft')} />
      </div>

      {/* Generate / mode cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHead title="Generate" subtitle="Pick a use case to start a new case. Average turnaround: ~4 minutes." />
        <div style={{ display: 'flex', gap: 16 }}>
          <ModeCard mode={MODES.appeal} hint="MOST USED" onClick={() => onPickMode('appeal')} />
          <ModeCard mode={MODES.note} onClick={() => onPickMode('note')} />
          <ModeCard mode={MODES.p2p} onClick={() => onPickMode('p2p')} />
        </div>
      </div>

      {/* Active queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionHead
          title="Active queue"
          subtitle="Filed appeals and prep awaiting decision."
          right={<Btn small onClick={() => onOpenHistoryFiltered('filed')}>View all<Icon k="arrow" size={12} /></Btn>} />
        
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {activeQueue.length === 0 ?
          <div style={{ padding: 28, textAlign: 'center', color: T.ink3, fontSize: 13 }}>Nothing pending.</div> :
          activeQueue.map((r) => <CaseRow key={r.id} row={r} onClick={() => onOpenItem(r)} />)}
        </Card>
      </div>

      {/* Recently decided */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionHead
          title="Recently decided"
          subtitle="Latest reviewer outcomes."
          right={<Btn small onClick={() => onOpenHistoryFiltered('overturned')}>View all<Icon k="arrow" size={12} /></Btn>} />
        
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {completed.map((r) => <CaseRow key={r.id} row={r} onClick={() => onOpenItem(r)} />)}
        </Card>
      </div>
    </div>);

};

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD — rev-cycle metrics
// ═══════════════════════════════════════════════════════════════════════════

const Sparkline = ({ points, color = T.brand, height = 28, width = 80 }) => {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const step = width / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - (p - min) / range * height).toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(points.length - 1) * step} cy={height - (points[points.length - 1] - min) / range * height} r="2" fill={color} />
    </svg>);

};

const KPICard = ({ label, value, delta, deltaTone, sub, spark, sparkColor }) =>
<Card style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label>{label}</Label>
      {spark && <Sparkline points={spark} color={sparkColor || T.brand} />}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5, color: T.ink, fontFamily: T.sans }}>{value}</div>
      {delta &&
    <div style={{
      fontSize: 11.5, fontFamily: T.mono, fontWeight: 500,
      color: deltaTone === 'good' ? T.approved : deltaTone === 'bad' ? T.denied : T.ink3
    }}>{delta}</div>
    }
    </div>
    <div style={{ fontSize: 11.5, color: T.ink3 }}>{sub}</div>
  </Card>;


const HBar = ({ label, value, max, count, tint = T.brand }) =>
<div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 56px', alignItems: 'center', gap: 12, fontSize: 12.5 }}>
    <div style={{ color: T.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
    <div style={{ height: 8, background: T.paper3, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value / max * 100}%`, background: tint, borderRadius: 4 }} />
    </div>
    <Mono style={{ color: T.ink3, textAlign: 'right', fontSize: 11.5 }}>{count}</Mono>
  </div>;


const TrendChart = ({ months }) => {
  const max = Math.max(...months.map((m) => m.filed));
  const H = 132;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: H, paddingTop: 8 }}>
        {months.map((m, i) => {
          const filedH = m.filed / max * (H - 24);
          const ovH = m.overturned / max * (H - 24);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4, width: '100%', justifyContent: 'center' }}>
                <div title={`${m.filed} filed`} style={{ width: 16, height: filedH, background: '#dbe8f8', border: `1px solid #bdd4f0`, borderRadius: 3 }} />
                <div title={`${m.overturned} overturned`} style={{ width: 16, height: ovH, background: T.brand, borderRadius: 3 }} />
              </div>
              <Mono style={{ fontSize: 10.5, color: T.ink3 }}>{m.label}</Mono>
            </div>);

        })}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.ink3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, background: '#dbe8f8', border: `1px solid #bdd4f0`, borderRadius: 2 }} /> Filed
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, background: T.brand, borderRadius: 2 }} /> Overturned
        </div>
      </div>
    </div>);

};

const TimeToDecision = () => {
  const buckets = [
  { label: '0–24h', count: 4, pct: 9 },
  { label: '1–3d', count: 12, pct: 26 },
  { label: '3–7d', count: 18, pct: 38 },
  { label: '7–14d', count: 9, pct: 19 },
  { label: '14d+', count: 4, pct: 9 }];

  const maxPct = Math.max(...buckets.map((b) => b.pct));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {buckets.map((b, i) =>
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 64px', alignItems: 'center', gap: 12, fontSize: 12 }}>
          <Mono style={{ color: T.ink3 }}>{b.label}</Mono>
          <div style={{ height: 8, background: T.paper3, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${b.pct / maxPct * 100}%`, background: i < 2 ? T.approved : i < 3 ? T.brand : T.pending, borderRadius: 4 }} />
          </div>
          <Mono style={{ color: T.ink3, textAlign: 'right' }}>{b.count} · {b.pct}%</Mono>
        </div>
      )}
    </div>);

};

const Dashboard = ({ onPickMode }) => {
  const denialReasons = [
  ['Medical necessity', 22],
  ['Level of care', 14],
  ['Observation → inpatient', 9],
  ['Documentation', 6],
  ['Other', 4]];

  const denialsByInsurer = [
  ['UnitedHealthcare', 18, 16, '89%'],
  ['Aetna', 13, 10, '77%'],
  ['Anthem BCBS', 9, 7, '78%'],
  ['Cigna', 8, 6, '75%'],
  ['Humana', 4, 3, '75%'],
  ['Medicare', 3, 2, '67%']];

  const trend = [
  { label: 'Dec', filed: 38, overturned: 31 },
  { label: 'Jan', filed: 42, overturned: 34 },
  { label: 'Feb', filed: 51, overturned: 41 },
  { label: 'Mar', filed: 44, overturned: 36 },
  { label: 'Apr', filed: 49, overturned: 39 },
  { label: 'May', filed: 47, overturned: 38 }];

  const maxReason = Math.max(...denialReasons.map((r) => r[1]));
  const maxInsurer = Math.max(...denialsByInsurer.map((r) => r[1]));

  return (
    <>
      <PageHeader
        eyebrow="REPORTING · MAY 2026"
        title="Dashboard"
        search
        actions={
        <div style={{ display: 'flex', gap: 6 }}>
            <Pill tone="soft" active>This month</Pill>
            <Pill tone="soft" onClick={() => {}}>Last 3 mo</Pill>
            <Pill tone="soft" onClick={() => {}}>YTD</Pill>
          </div>
        } />
      
      <div className="screen" style={{ padding: '24px 32px 40px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <KPICard
            label="Denials received"
            value="55"
            delta="↑ 12% vs Apr"
            deltaTone="bad"
            sub="38% of claims this month"
            spark={[31, 34, 38, 49, 51, 55]}
            sparkColor={T.denied} />
          
          <KPICard
            label="Appeals filed"
            value="47"
            delta="85% of denials"
            sub="9 still pending review"
            spark={[28, 33, 38, 41, 46, 47]}
            sparkColor={T.brand} />
          
          <KPICard
            label="Overturn rate"
            value="81%"
            delta="↑ 4 pts vs Apr"
            deltaTone="good"
            sub="38 of 47 decided in your favor"
            spark={[72, 74, 78, 75, 77, 81]}
            sparkColor={T.approved} />
          
          <KPICard
            label="Revenue recovered"
            value="$483K"
            delta="↑ $61K vs Apr"
            deltaTone="good"
            sub="Estimated this month"
            spark={[290, 340, 380, 410, 422, 483]}
            sparkColor={T.approved} />
          
        </div>

        {/* Denials by reason + outcomes by insurer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionHead
              title="Denials by reason"
              subtitle="What insurers are flagging this month."
              right={<Mono style={{ fontSize: 11, color: T.ink3 }}>n = 55</Mono>} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {denialReasons.map(([l, v], i) =>
              <HBar key={i} label={l} value={v} max={maxReason} count={v} tint={[T.denied, T.pending, T.brand, T.ink3, T.ink4][i]} />
              )}
            </div>
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionHead
              title="Outcomes by insurer"
              subtitle="Denied vs. overturned (you / them)."
              right={<Mono style={{ fontSize: 11, color: T.ink3 }}>this month</Mono>} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {denialsByInsurer.map(([l, denied, overt, pct], i) =>
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 90px', alignItems: 'center', gap: 12, fontSize: 12.5 }}>
                  <div style={{ color: T.ink2 }}>{l}</div>
                  <div style={{ position: 'relative', height: 8, background: T.paper3, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${denied / maxInsurer * 100}%`, background: '#fdd6d6', borderRadius: 4 }} />
                    <div style={{ position: 'absolute', inset: 0, width: `${overt / maxInsurer * 100}%`, background: T.approved, borderRadius: 4 }} />
                  </div>
                  <Mono style={{ color: T.ink3, textAlign: 'right', fontSize: 11.5 }}>{overt}/{denied} · {pct}</Mono>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Trend + Time to decision */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionHead
              title="6-month trend"
              subtitle="Appeals filed vs. overturned in your favor." />
            
            <TrendChart months={trend} />
            <div style={{ fontSize: 11.5, color: T.ink3, lineHeight: 1.6, marginTop: 4 }}>
              Average overturn rate · <Mono style={{ color: T.ink2 }}>81.3%</Mono> over last 6 mo.<br />
              <Mono style={{ color: T.ink2 }}>$2.8M</Mono> revenue recovered YTD.
            </div>
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionHead title="Time to decision" subtitle="From appeal filed to reviewer response." />
            <TimeToDecision />
            <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 4 }}>
              Median <Mono style={{ color: T.ink2 }}>4.2 days</Mono> · 64% decided within a week.
            </div>
          </Card>
        </div>

        {/* Pending decisions */}
        <Card pad={0}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.line2}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, letterSpacing: -0.1 }}>Awaiting reviewer decision</div>
              <div style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>Cases filed but not yet adjudicated.</div>
            </div>
            <Mono style={{ fontSize: 11, color: T.ink3 }}>9 PENDING</Mono>
          </div>
          {[
          { dx: '67yo F, severe sepsis — vasopressors', insurer: 'UnitedHealthcare', filed: 'Today', days: '4 days', claim: 'CLM-48201' },
          { dx: '54yo M, NSTEMI — cath day 2', insurer: 'Aetna', filed: 'Today', days: '3 days', claim: 'CLM-48198' },
          { dx: '76yo F, CHF exac — IV diuresis', insurer: 'Anthem BCBS', filed: 'Yesterday', days: '5 days', claim: 'CLM-48064' },
          { dx: '70yo M, PE on CTA — apixaban', insurer: 'UnitedHealthcare', filed: 'May 16', days: '2 days', claim: 'CLM-47987' },
          { dx: '49yo M, DKA — insulin gtt', insurer: 'Cigna', filed: 'Today', days: '6 days', claim: 'CLM-48142' },
          { dx: '52yo F, cellulitis abscess — IV vanc', insurer: 'Humana', filed: 'May 15', days: '1 day', claim: 'CLM-47931' }].
          map((p, i) =>
          <div key={i} className="row-hover" style={{
            display: 'grid', gridTemplateColumns: '110px 1fr auto 110px 28px', gap: 12,
            padding: '12px 18px', borderBottom: i < 5 ? `1px solid ${T.line2}` : 'none',
            fontSize: 12.5, alignItems: 'center', cursor: 'pointer'
          }}>
              <Mono style={{ color: T.ink3, fontSize: 11 }}>{p.claim}</Mono>
              <div style={{ color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.dx}</div>
              <Pill tone="soft">{p.insurer}</Pill>
              <Mono style={{ color: T.ink3, fontSize: 11, textAlign: 'right' }}>{p.days} left</Mono>
              <Icon k="chevron" size={13} color={T.ink4} />
            </div>
          )}
        </Card>
      </div>
    </>);

};

// ═══════════════════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════════════════

const ModeTabs = ({ active, onChange }) =>
<div style={{ display: 'inline-flex', background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 7, padding: 3 }}>
    {Object.values(MODES).map((m) =>
  <div key={m.key} onClick={() => onChange(m.key)} style={{
    padding: '6px 12px', borderRadius: 5,
    background: active === m.key ? T.paper : 'transparent',
    color: active === m.key ? T.ink : T.ink3,
    fontSize: 12.5, fontWeight: active === m.key ? 500 : 400,
    display: 'flex', alignItems: 'center', gap: 6,
    cursor: 'pointer',
    boxShadow: active === m.key ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
    letterSpacing: -0.05
  }}>
        <Icon k={m.icon} size={13} color={active === m.key ? T.brand : T.ink3} />
        <span>{m.title}</span>
      </div>
  )}
  </div>;


const SamplePicker = ({ onPick, currentId }) =>
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Label>Try a sample case</Label>
      <Mono style={{ fontSize: 10.5, color: T.ink4 }}>(prefills the form)</Mono>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {SAMPLES.map((s) =>
    <div
      key={s.id}
      onClick={() => onPick(s)}
      className="card-hover"
      style={{
        padding: '10px 12px',
        border: `1px solid ${currentId === s.id ? T.brand : T.line}`,
        background: currentId === s.id ? T.brandSoft : T.paper,
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 4
      }}>
      
          <div style={{ fontSize: 12.5, fontWeight: 500, color: T.ink }}>{s.label}</div>
          <div style={{ fontSize: 11.5, color: T.ink3, lineHeight: 1.4 }}>{s.description}</div>
        </div>
    )}
    </div>
  </div>;


const Input = ({ mode, onMode, onBack, form, setForm, onGenerate, onLoadSample }) => {
  const m = MODES[mode];
  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canGenerate) onGenerate();
    }
  };
  const canGenerate = form.story && form.story.trim().length > 30;

  return (
    <>
      <PageHeader
        eyebrow={<span onClick={onBack} style={{ cursor: 'pointer' }}>← HOME</span>}
        title={m.inputLabel}
        actions={<ModeTabs active={mode} onChange={onMode} />} />
      
      <div className="screen" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ padding: '24px 32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ width: '100%', maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 36 }}>

            <Card>
              <SamplePicker onPick={onLoadSample} currentId={form.sampleId} />
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionHead title="Case context" />
              <div style={{ display: 'grid', gridTemplateColumns: mode === 'p2p' ? '1.2fr 1fr 1fr 1fr' : '1.4fr 1fr 1fr', gap: 10 }}>
                {mode === 'note' ?
                <>
                    <FieldRow label="Setting"><Select value={form.setting || 'Inpatient'} onChange={(v) => setForm({ ...form, setting: v })} options={SETTINGS} /></FieldRow>
                    <FieldRow label="Target level of care"><Select value={form.level || 'Inpatient'} onChange={(v) => setForm({ ...form, level: v })} options={SETTINGS} /></FieldRow>
                    <FieldRow label="Criteria"><Select mono value={form.criteria || 'InterQual'} onChange={(v) => setForm({ ...form, criteria: v })} options={CRITERIA} /></FieldRow>
                  </> :
                mode === 'p2p' ?
                <>
                    <FieldRow label="Insurer"><Select value={form.insurer || 'UnitedHealthcare'} onChange={(v) => setForm({ ...form, insurer: v })} options={INSURERS} /></FieldRow>
                    <FieldRow label="Call scheduled"><TextField mono value={form.callTime || 'Today, 2:00 PM'} onChange={(v) => setForm({ ...form, callTime: v })} /></FieldRow>
                    <FieldRow label="Reviewer"><TextField value={form.reviewer || ''} onChange={(v) => setForm({ ...form, reviewer: v })} placeholder="e.g. Dr. Smith" /></FieldRow>
                    <FieldRow label="Criteria"><Select mono value={form.criteria || 'InterQual'} onChange={(v) => setForm({ ...form, criteria: v })} options={CRITERIA} /></FieldRow>
                  </> :

                <>
                    <FieldRow label="Insurer"><Select value={form.insurer || 'UnitedHealthcare'} onChange={(v) => setForm({ ...form, insurer: v })} options={INSURERS} /></FieldRow>
                    <FieldRow label="Appeal level"><Select value={form.level || 'First-level'} onChange={(v) => setForm({ ...form, level: v })} options={LEVELS} /></FieldRow>
                    <FieldRow label="Criteria"><Select mono value={form.criteria || 'InterQual'} onChange={(v) => setForm({ ...form, criteria: v })} options={CRITERIA} /></FieldRow>
                  </>
                }
              </div>
            </Card>

            {mode !== 'note' &&
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SectionHead title="Denial reason" subtitle="Paste the language from the insurer's correspondence." />
                <TextArea
                value={form.denial || ''}
                onChange={(v) => setForm({ ...form, denial: v })}
                placeholder="e.g. Inpatient stay does not meet medical necessity criteria. Could have been managed at observation level of care."
                height={92}
                onKeyDown={handleKey} />
              
              </Card>
            }

            <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionHead
                title={mode === 'note' ? 'Clinical facts' : 'Clinical story'}
                subtitle={mode === 'note' ?
                'Notes, dictation, vitals, labs — whatever you\'ve got. We\'ll rewrite it in criteria-aligned language.' :
                'Include presentation, vitals, labs, interventions, and course.'}
                right={<Mono style={{ fontSize: 10.5, color: T.ink4 }}>{(form.story || '').length} / 4,000</Mono>} />
              
              <TextArea
                value={form.story || ''}
                onChange={(v) => setForm({ ...form, story: v.slice(0, 4000) })}
                placeholder="Paste the de-identified clinical story here…"
                height={240}
                onKeyDown={handleKey} />
              
              <DeIdStrip />
            </Card>

            <div style={{
              position: 'sticky', bottom: 0, marginTop: 4,
              background: `linear-gradient(180deg, rgba(238,242,247,0) 0%, ${T.bg} 30%)`,
              paddingTop: 16, paddingBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <Mono style={{ fontSize: 11, color: T.ink3 }}>⌘↵ to generate · Esc to cancel</Mono>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <Btn onClick={onBack}>Cancel</Btn>
                <Btn primary disabled={!canGenerate} onClick={onGenerate} style={{ height: 42, padding: '0 22px' }}>
                  <Icon k="send" size={14} color={T.paper} />{m.generateLabel}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>);

};

// ═══════════════════════════════════════════════════════════════════════════
// GENERATING
// ═══════════════════════════════════════════════════════════════════════════

const GENERATING_PHASES = [
'Scanning for PHI and de-identifying…',
'Mapping facts to InterQual / MCG criteria…',
'Drafting argument…',
'Pulling in citations…',
'Polishing language…'];


const Generating = ({ mode, onCancel, phase }) => {
  const m = MODES[mode];
  return (
    <div className="screen" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 36, minHeight: 600 }}>
      <Card style={{ width: 480, padding: 28, display: 'flex', flexDirection: 'column', gap: 22, boxShadow: '0 1px 0 rgba(15,23,42,0.02), 0 14px 50px rgba(15,23,42,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: T.brandSoft, border: `1px solid #cfe0f3`,
            display: 'grid', placeItems: 'center', color: T.brand
          }}>
            <Icon k="sparkles" size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, letterSpacing: -0.2 }}>Generating your {m.title.toLowerCase()}</div>
            <Mono style={{ fontSize: 10.5, color: T.ink3, letterSpacing: 0.3, textTransform: 'uppercase' }}>typically completes in 3–6 seconds</Mono>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GENERATING_PHASES.map((p, i) => {
            const done = i < phase;
            const active = i === phase;
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: done ? T.ink3 : active ? T.ink : T.ink4 }}>
                <div style={{ width: 14, display: 'grid', placeItems: 'center' }}>
                  {done ? <Icon k="check" size={12} color={T.approved} /> :
                  active ? <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> :
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.line }} />}
                </div>
                <span className={active ? 'pulse' : ''}>{p}</span>
              </div>);

          })}
        </div>

        <Btn small ghost onClick={onCancel} style={{ alignSelf: 'flex-end' }}>Cancel</Btn>
      </Card>
    </div>);

};

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT — Appeal letter, Note, P2P
// ═══════════════════════════════════════════════════════════════════════════

const LetterHeaderView = ({ h }) =>
<div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, lineHeight: 1.7 }}>
    <div><Mono style={{ color: T.ink3, fontSize: 10.5, marginRight: 10, letterSpacing: 0.4 }}>TO</Mono>{h.to}</div>
    <div><Mono style={{ color: T.ink3, fontSize: 10.5, marginRight: 10, letterSpacing: 0.4 }}>FROM</Mono>{h.from}</div>
    <div><Mono style={{ color: T.ink3, fontSize: 10.5, marginRight: 10, letterSpacing: 0.4 }}>RE</Mono>{h.re}</div>
    <div><Mono style={{ color: T.ink3, fontSize: 10.5, marginRight: 10, letterSpacing: 0.4 }}>DATE</Mono>{h.date}</div>
  </div>;


const AppealDoc = ({ result, progress, onCopySection }) => {
  const paras = result.paragraphs;
  const visibleChars = Math.floor(paras.join(' ').length * progress);
  let used = 0;
  const isStreaming = progress < 1;

  return (
    <div style={{
      background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10,
      padding: '40px 52px',
      display: 'flex', flexDirection: 'column', gap: 22,
      maxWidth: 720, margin: '0 auto',
      boxShadow: '0 1px 0 rgba(15,23,42,0.02), 0 8px 24px rgba(15,23,42,0.04)',
      fontFamily: T.serif
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}><LetterHeaderView h={result.letterHeader} /></div>
        {!isStreaming &&
        <Btn small onClick={() => onCopySection('Header', `${result.letterHeader.to}\n${result.letterHeader.from}\n${result.letterHeader.re}\n${result.letterHeader.date}`)}>
            <Icon k="copy" size={12} />Copy header
          </Btn>
        }
      </div>
      <div style={{ height: 1, background: T.line2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, lineHeight: 1.75, color: T.ink, fontFamily: T.serif }}>
        {paras.map((p, i) => {
          const remaining = isStreaming ? Math.max(0, visibleChars - used) : p.length;
          used += p.length;
          if (remaining <= 0) return null;
          const text = remaining < p.length ? p.slice(0, remaining) : p;
          return (
            <div key={i} className="sec-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                {renderInline(text)}
                {isStreaming && remaining < p.length && <span className="caret" />}
              </div>
              {!isStreaming && (i === 2 || i === 3) &&
              <button
                className="sec-copy"
                onClick={() => onCopySection(`Paragraph ${i + 1}`, plainText(p))}
                style={{ flex: '0 0 auto', background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink3, padding: 4 }}
                title="Copy paragraph">
                <Icon k="copy" size={13} /></button>
              }
            </div>);

        })}
      </div>
    </div>);

};

const NoteDoc = ({ result, progress, onCopySection }) => {
  const isStreaming = progress < 1;
  const visibleSecs = Math.ceil(result.sections.length * progress + 0.4);
  return (
    <div style={{
      background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10,
      padding: '32px 44px', display: 'flex', flexDirection: 'column', gap: 18,
      maxWidth: 720, margin: '0 auto',
      boxShadow: '0 1px 0 rgba(15,23,42,0.02), 0 8px 24px rgba(15,23,42,0.04)'
    }}>
      {result.sections.slice(0, visibleSecs).map((s, i) => {
        const isLastVisible = i === visibleSecs - 1 && isStreaming;
        const ratio = isLastVisible ? Math.max(0, Math.min(1, result.sections.length * progress - i)) : 1;
        const body = ratio < 1 ? s.body.slice(0, Math.floor(s.body.length * ratio)) : s.body;
        return (
          <div key={i} className="sec-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Label>{s.h}</Label>
              <div style={{ fontSize: 13.5, lineHeight: 1.7, color: T.ink2, marginTop: 6, whiteSpace: 'pre-wrap' }}>
                {renderInline(body)}
                {isLastVisible && <span className="caret" />}
              </div>
            </div>
            {!isStreaming &&
            <button
              className="sec-copy"
              onClick={() => onCopySection(s.h, plainText(s.body))}
              style={{ flex: '0 0 auto', background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink3, padding: 4 }}>
              <Icon k="copy" size={13} /></button>
            }
          </div>);

      })}
    </div>);

};

const P2PSheet = ({ result, progress, onCopySection }) => {
  const isStreaming = progress < 1;
  const phaseCount = 5;
  const phaseFloat = progress * phaseCount;
  const show = (idx) => phaseFloat > idx;
  const partialRatio = (idx) => Math.max(0, Math.min(1, phaseFloat - idx));
  const argHead = { fontSize: 10.5, color: T.ink3, fontFamily: T.sans, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {show(0) &&
      <div className="sec-row" style={{ background: T.paper, border: `2px solid ${T.brand}`, borderRadius: 10, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', boxShadow: '0 1px 0 rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={argHead}>Open with this · ~30 sec</span>
            <Pill tone="brand">say verbatim</Pill>
            {!isStreaming &&
          <button
            className="sec-copy"
            onClick={() => onCopySection('Opener', plainText(result.opener))}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink3 }}>
            <Icon k="copy" size={13} /></button>
          }
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.65, color: T.ink, fontStyle: 'italic', fontFamily: T.serif }}>
            "{renderInline(result.opener.slice(0, Math.floor(result.opener.length * partialRatio(0))))}"
            {phaseFloat < 1 && <span className="caret" />}
          </div>
        </div>
      }

      {show(1) &&
      <Card pad={20} className="sec-row" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={argHead}>Why this meets criteria</div>
          {result.arguments.slice(0, Math.ceil(result.arguments.length * partialRatio(1))).map((b, i) =>
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12, alignItems: 'baseline', paddingTop: 10, borderTop: i > 0 ? `1px dashed ${T.line2}` : 'none' }}>
              <Pill tone={b.tag === 'SI' ? 'brand' : 'soft'} style={{ fontSize: 10.5, fontFamily: T.mono, justifySelf: 'start' }}>{b.tag}</Pill>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: T.ink2 }}>{b.body}</div>
              <Mono style={{ fontSize: 10.5, color: T.ink4, whiteSpace: 'nowrap' }}>{b.ref}</Mono>
            </div>
        )}
        </Card>
      }

      {show(2) &&
      <Card pad={20} className="sec-row" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={argHead}>If they say… → You say</div>
          {result.pushbacks.slice(0, Math.ceil(result.pushbacks.length * partialRatio(2))).map((p, i) =>
        <div key={i} style={{ paddingTop: 10, borderTop: i > 0 ? `1px dashed ${T.line2}` : 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12.5, color: T.ink3, fontStyle: 'italic', fontFamily: T.serif }}>{p.q}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: T.ink, display: 'flex', gap: 8 }}>
                <span style={{ color: T.brand, fontWeight: 700 }}>→</span>
                <span>{p.a}</span>
              </div>
            </div>
        )}
        </Card>
      }

      {show(3) &&
      <Card pad={20} className="sec-row" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={argHead}>Keep these numbers handy</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 4, border: `1px solid ${T.line2}`, borderRadius: 6, overflow: 'hidden' }}>
            {result.data.slice(0, Math.ceil(result.data.length * partialRatio(3))).map(([k, v], i) =>
          <div key={i} style={{
            padding: '12px 14px',
            borderRight: i % 4 !== 3 ? `1px solid ${T.line2}` : 'none',
            borderTop: i >= 4 ? `1px solid ${T.line2}` : 'none',
            background: T.paper2
          }}>
                <Mono style={{ fontSize: 10, color: T.ink3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block' }}>{k}</Mono>
                <div style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.4 }}>{v}</div>
              </div>
          )}
          </div>
        </Card>
      }

      {show(4) &&
      <Card pad={20} className="sec-row" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={argHead}>Phrases that tend to land</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {result.phrases.slice(0, Math.ceil(result.phrases.length * partialRatio(4))).map((p, i) =>
          <Pill key={i} tone="soft">{p}</Pill>
          )}
          </div>
        </Card>
      }
    </div>);

};

const RefineSidebar = ({ mode, result, refineLog, onRefine, refining, onRegenerate, onEditInputs, onNew }) => {
  const m = MODES[mode];
  const [draft, setDraft] = useState('');
  const suggestions = mode === 'appeal' ?
  ['+ cite lactate trend', '+ shorter', '+ more direct', '+ stronger pushback on outpatient'] :
  mode === 'note' ?
  ['+ shorter HPI', '+ add ROS', '+ more cite-heavy', '+ merge HPI and exam'] :
  ['+ shorter', '+ add MCG refs', '+ more phrases', '+ extra pushback'];

  const send = () => {
    if (!draft.trim()) return;
    onRefine(draft.trim());
    setDraft('');
  };

  return (
    <div style={{ borderLeft: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.paper }}>
      {mode === 'p2p' ?
      <div style={{ padding: '20px 22px', borderBottom: `1px solid ${T.line2}`, display: 'flex', flexDirection: 'column', gap: 6, background: `linear-gradient(180deg, #fef3f2 0%, ${T.paper} 100%)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Label>Call in</Label>
            <Pill tone="brand" style={{ marginLeft: 'auto' }}>UHC reviewer</Pill>
          </div>
          <Mono style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.8, color: T.urgent, fontFamily: T.mono }}>{result.meta.callIn}</Mono>
          <div style={{ fontSize: 11.5, color: T.ink3 }}>Scheduled · 2:00 PM today</div>
        </div> :

      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.line2}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Label>{mode === 'appeal' ? 'Criteria cited' : 'Criteria coverage'}</Label>
            <Icon k="sparkles" size={12} color={T.ink4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(result.criteriaCited || []).map(([k, v], i) =>
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                <Mono style={{ color: T.ink3, width: 70, flex: '0 0 auto' }}>{k}</Mono>
                <div style={{ color: T.ink2, flex: 1, lineHeight: 1.55 }}>{v}</div>
              </div>
          )}
          </div>
        </div>
      }

      <div style={{ padding: '18px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', minHeight: 0 }}>
        <Label>Refine</Label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {refineLog.length === 0 && !refining &&
          <div style={{ fontSize: 12, color: T.ink3, fontStyle: 'italic' }}>
              No refinements yet — ask for changes below.
            </div>
          }
          {refineLog.map((r, i) =>
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ background: T.paper2, border: `1px solid ${T.line2}`, borderRadius: 8, padding: 10, fontSize: 12.5, color: T.ink2 }}>
                "{r.prompt}"
              </div>
              <Mono style={{ fontSize: 10.5, color: T.ink3, paddingLeft: 4 }}>↳ {r.summary} · {r.age}</Mono>
            </div>
          )}
          {refining &&
          <div style={{ background: T.paper2, border: `1px solid ${T.line2}`, borderRadius: 8, padding: 10, fontSize: 12.5, color: T.ink3, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
              applying refinement…
            </div>
          }
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {e.preventDefault();send();}}}
            placeholder="Ask for changes — e.g. 'strengthen the argument about ICU transfer'"
            style={{
              border: `1px solid ${T.line}`, borderRadius: 8, padding: 10,
              fontSize: 12.5, color: T.ink, minHeight: 64, resize: 'vertical',
              fontFamily: T.sans, lineHeight: 1.5
            }} />
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((s, i) =>
            <Pill key={i} tone="soft" onClick={() => setDraft(s.slice(2))}>{s}</Pill>
            )}
          </div>
          <Btn primary small disabled={!draft.trim() || refining} onClick={send} style={{ alignSelf: 'flex-end' }}>
            <Icon k="send" size={12} color={T.paper} />Apply
          </Btn>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${T.line}`, padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: 8, background: T.paper2 }}>
        <Btn primary onClick={onNew} style={{ height: 38 }}>
          <Icon k="plus" size={14} color={T.paper} />{m.nextLabel}
        </Btn>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn small style={{ flex: 1 }} onClick={onRegenerate}><Icon k="reload" size={12} />Regenerate</Btn>
          <Btn small style={{ flex: 1 }} onClick={onEditInputs}><Icon k="pencil" size={12} />Edit inputs</Btn>
        </div>
      </div>
    </div>);

};

const OutputHeader = ({ mode, result, caseLabel, onBack, onCopyAll, generationTime, isStreaming, status }) => {
  const m = MODES[mode];
  return (
    <div style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.line}`, background: T.paper, flexWrap: 'wrap' }}>
      <div onClick={onBack} style={{ fontSize: 12, color: T.ink3, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Icon k="arrowL" size={12} /> Edit inputs
      </div>
      <div style={{ width: 1, height: 14, background: T.line }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon k={m.icon} size={14} color={T.brand} />
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, letterSpacing: -0.1 }}>{m.title}</div>
          {status && <StatusBadge status={status} small />}
        </div>
        <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>{caseLabel}</div>
      </div>
      {result.meta.insurer && <Pill tone="soft">{result.meta.insurer}</Pill>}
      {result.meta.level && <Pill tone="soft">{result.meta.level}</Pill>}
      {result.meta.criteria && <Pill tone="soft">{result.meta.criteria}</Pill>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {!isStreaming && generationTime && <Mono style={{ fontSize: 11, color: T.ink3 }}>generated · {generationTime}s</Mono>}
        <Btn small primary disabled={isStreaming} onClick={onCopyAll}>
          <Icon k="copy" size={13} color={T.paper} />Copy full {mode === 'appeal' ? 'letter' : mode === 'note' ? 'note' : 'prep'}
        </Btn>
      </div>
    </div>);

};

const Output = ({ mode, result, refineLog, refining, onCopy, onRefine, onRegenerate, onEditInputs, onNew, onBack, caseLabel, generationTime, status }) => {
  const progress = useStreamReveal(result, () => {});
  const isStreaming = progress < 1;

  const fullText = useMemo(() => {
    if (mode === 'appeal') {
      return [
      `${result.letterHeader.to}`,
      `From: ${result.letterHeader.from}`,
      `RE: ${result.letterHeader.re}`,
      `Date: ${result.letterHeader.date}`,
      '',
      ...result.paragraphs.map(plainText)].
      join('\n\n');
    }
    if (mode === 'note') {
      return result.sections.map((s) => `${s.h.toUpperCase()}\n${plainText(s.body)}`).join('\n\n');
    }
    return [
    `OPENER:\n${plainText(result.opener)}`,
    `\nWHY THIS MEETS CRITERIA:`,
    ...result.arguments.map((a) => `· [${a.tag}] ${a.body}  (${a.ref})`),
    `\nANTICIPATED PUSHBACKS:`,
    ...result.pushbacks.map((p) => `Q: ${p.q}\nA: ${p.a}`),
    `\nKEY DATA:`,
    ...result.data.map(([k, v]) => `· ${k}: ${v}`),
    `\nPHRASES:`,
    ...result.phrases.map((p) => `· ${p}`)].
    join('\n');
  }, [result, mode]);

  return (
    <div className="screen" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OutputHeader
        mode={mode} result={result} caseLabel={caseLabel}
        onBack={onBack} onCopyAll={() => onCopy('Full ' + mode, fullText)}
        generationTime={generationTime} isStreaming={isStreaming}
        status={status} />
      
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '26px 32px', overflow: 'auto', background: T.bg }}>
          {mode === 'appeal' && <AppealDoc result={result} progress={progress} onCopySection={onCopy} />}
          {mode === 'note' && <NoteDoc result={result} progress={progress} onCopySection={onCopy} />}
          {mode === 'p2p' && <P2PSheet result={result} progress={progress} onCopySection={onCopy} />}
        </div>
        <RefineSidebar
          mode={mode} result={result}
          refineLog={refineLog} refining={refining}
          onRefine={onRefine}
          onRegenerate={onRegenerate} onEditInputs={onEditInputs} onNew={onNew} />
        
      </div>
    </div>);

};

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════════════

const History = ({ history, onOpen, onBack, onClear, initialStatusFilter }) => {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');

  useEffect(() => {
    if (initialStatusFilter) setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const filtered = history.filter((r) => {
    if (filter !== 'all' && r.modeKey !== filter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (q && !(r.preview + ' ' + r.tag + ' ' + r.type + ' ' + (r.claimId || '')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow={<span onClick={onBack} style={{ cursor: 'pointer', borderStyle: "solid", borderWidth: "0px 0px 1px", fontSize: "15px" }}>HOME

</span>} title="History" actions={
        <Btn small ghost onClick={onClear}>Clear all</Btn>
        } />
      
      <div className="screen" style={{ padding: '20px 32px 40px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 300px', minWidth: 300, display: 'flex', alignItems: 'center', gap: 10,
            border: `1px solid ${T.line}`, borderRadius: 8, padding: '0 14px', height: 38, background: T.paper
          }}>
            <Icon k="search" size={14} color={T.ink3} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by diagnosis, claim ID, insurer, denial reason…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: T.ink }} />
            
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', 'All types'], ['appeal', 'Appeals'], ['note', 'Notes'], ['p2p', 'P2P']].map(([k, label]) =>
            <Pill key={k} tone="soft" active={filter === k} onClick={() => setFilter(k)}>{label}</Pill>
            )}
          </div>
          <div style={{ width: 1, height: 24, background: T.line }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', 'All status'], ['urgent', 'Deadline'], ['pending', 'Pending'], ['filed', 'Filed'], ['overturned', 'Overturned'], ['approved', 'Approved'], ['denied', 'Denied'], ['draft', 'Draft']].map(([k, label]) =>
            <Pill key={k} tone="soft" active={statusFilter === k} onClick={() => setStatusFilter(k)}>{label}</Pill>
            )}
          </div>
        </div>

        <Card pad={0}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '24px 92px 1fr 120px 100px 14px',
            gap: 14, padding: '10px 18px',
            background: T.paper2, borderBottom: `1px solid ${T.line}`,
            fontSize: 10.5, color: T.ink3, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase'
          }}>
            <div />
            <div>Claim ID</div>
            <div>Case</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>When</div>
            <div />
          </div>
          {filtered.length === 0 ?
          <div style={{ padding: '40px 20px', textAlign: 'center', color: T.ink3, fontSize: 13 }}>
              {history.length === 0 ? 'No cases yet.' : 'No matches for that filter.'}
            </div> :
          filtered.map((r) => <CaseRow key={r.id} row={r} onClick={() => onOpen(r)} dense />)}
        </Card>
      </div>
    </>);

};


export { Home, Dashboard, Input, Generating, Output, History, ModeTabs, CaseRow }
