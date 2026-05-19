import React from 'react';
import { T } from './theme';

// proto-ui.jsx — Clinical workspace UI primitives.
// Palette: cool slate / clinical blue / status-coded accents.
// Shell: dark sidebar nav (240px) + light main content area.

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ k, size = 16, color, style }) => {
  const s = { width: size, height: size, color: color || 'currentColor', flex: '0 0 auto', ...style };
  const stroke = { stroke: 'currentColor', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (k) {
    case 'home':    return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-7H9v7H5a1 1 0 01-1-1v-9z"/></svg>;
    case 'gauge':   return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M3 13a9 9 0 1118 0v6H3v-6z"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1" fill="currentColor"/></svg>;
    case 'history': return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M3 12a9 9 0 109-9 9 9 0 00-8 5"/><path d="M3 4v4h4"/><path d="M12 8v5l3 2"/></svg>;
    case 'note':    return <svg style={s} viewBox="0 0 24 24" {...stroke}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
    case 'letter':  return <svg style={s} viewBox="0 0 24 24" {...stroke}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
    case 'phone':   return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/></svg>;
    case 'copy':    return <svg style={s} viewBox="0 0 24 24" {...stroke}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg>;
    case 'reload':  return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M20 12a8 8 0 11-2.34-5.66M20 4v4h-4"/></svg>;
    case 'plus':    return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M12 5v14M5 12h14"/></svg>;
    case 'arrow':   return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrowL':  return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'search':  return <svg style={s} viewBox="0 0 24 24" {...stroke}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>;
    case 'pencil':  return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M4 20h4l10-10-4-4L4 16v4z"/></svg>;
    case 'check':   return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M5 12l4 4 10-10"/></svg>;
    case 'checkCircle': return <svg style={s} viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>;
    case 'send':    return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M4 12l16-8-6 18-3-7-7-3z"/></svg>;
    case 'chevron': return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevronD':return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M6 9l6 6 6-6"/></svg>;
    case 'x':       return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'sparkles':return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'shield':  return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M12 3l8 3v6c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'clock':   return <svg style={s} viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'star':    return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z"/></svg>;
    case 'bell':    return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5L6 16z"/><path d="M10 20a2 2 0 004 0"/></svg>;
    case 'alert':   return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>;
    case 'medical': return <svg style={s} viewBox="0 0 24 24" {...stroke}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/><path d="M12 11v6M9 14h6"/></svg>;
    case 'pulseLine': return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>;
    case 'doc':     return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v5h5"/></svg>;
    case 'filter':  return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></svg>;
    case 'flame':   return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M12 3s5 4 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-4 1-8z"/></svg>;
    case 'menu':    return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    case 'kebab':   return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
    case 'cmd':     return <svg style={s} viewBox="0 0 24 24" {...stroke}><path d="M9 6a3 3 0 11-3 3h12a3 3 0 11-3-3v12a3 3 0 11-3-3V6"/></svg>;
    case 'arrowOut': return <svg style={s} viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}><path d="M7 17L17 7M9 7h8v8"/></svg>;
    default:        return null;
  }
};

// ── Buttons ────────────────────────────────────────────────────────────────

const Btn = ({ children, primary, dark, small, ghost, danger, onClick, disabled, style, type, title }) => {
  const base = {
    height: small ? 30 : 38,
    padding: small ? '0 12px' : '0 16px',
    borderRadius: 6,
    fontFamily: T.sans,
    fontSize: small ? 12.5 : 13,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    letterSpacing: -0.05,
  };
  let look;
  if (primary) look = { background: T.brand, color: T.paper, border: `1px solid ${T.brand}`, boxShadow: '0 1px 0 rgba(8,67,120,0.15)' };
  else if (dark) look = { background: T.ink, color: T.paper, border: `1px solid ${T.ink}` };
  else if (ghost) look = { background: 'transparent', color: T.ink2, border: '1px solid transparent' };
  else if (danger) look = { background: T.paper, color: T.denied, border: `1px solid ${T.denBor}` };
  else look = { background: T.paper, color: T.ink, border: `1px solid ${T.line}`, boxShadow: '0 1px 0 rgba(15,23,42,0.02)' };
  return (
    <button type={type || 'button'} className="btn" onClick={onClick} disabled={disabled} title={title}
      style={{ ...base, ...look, ...style }}>{children}</button>
  );
};

// ── Status badge (status-coded for medical/insurance workflow) ────────────

const StatusBadge = ({ status, small, style }) => {
  const map = {
    'approved':   { bg: T.apprSoft, fg: T.approved,  br: T.apprBor, label: 'Approved' },
    'denied':     { bg: T.denSoft,  fg: T.denied,    br: T.denBor,  label: 'Denied' },
    'pending':    { bg: T.pendSoft, fg: T.pending,   br: T.pendBor, label: 'Pending review' },
    'overturned': { bg: T.ovSoft,   fg: T.overturned, br: T.ovBor,  label: 'Overturned' },
    'urgent':     { bg: '#fee2e2',  fg: T.urgent,    br: '#fca5a5', label: 'Deadline' },
    'draft':      { bg: T.paper3,   fg: T.ink3,      br: T.line,    label: 'Draft' },
    'filed':      { bg: T.brandSoft, fg: T.brandTxt, br: '#bdd4f0', label: 'Filed' },
  };
  const c = map[status] || map.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 4,
      background: c.bg, color: c.fg, border: `1px solid ${c.br}`,
      fontSize: small ? 10.5 : 11, fontFamily: T.sans, fontWeight: 500,
      letterSpacing: 0.1,
      ...style,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.fg }}/>
      {c.label}
    </span>
  );
};

// ── Generic pill (filter chips, tags) ─────────────────────────────────────

const Pill = ({ children, tone = 'neutral', style, onClick, active }) => {
  const map = {
    neutral: { bg: T.paper,   fg: T.ink2,    br: T.line  },
    soft:    { bg: T.paper3,  fg: T.ink3,    br: T.line  },
    dark:    { bg: T.ink,     fg: T.paper,   br: T.ink  },
    brand:   { bg: T.brandSoft, fg: T.brandTxt, br: '#bdd4f0' },
  };
  const c = map[active ? 'dark' : tone] || map.neutral;
  return (
    <span onClick={onClick} className={onClick ? 'tag-hover' : ''} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999,
      background: c.bg, color: c.fg, border: `1px solid ${c.br}`,
      fontSize: 11.5, fontFamily: T.sans, fontWeight: 500,
      cursor: onClick ? 'pointer' : 'default',
      letterSpacing: -0.05,
      ...style,
    }}>{children}</span>
  );
};

const Mono = ({ children, style }) => (
  <span style={{ fontFamily: T.mono, ...style }}>{children}</span>
);

const Label = ({ children, style }) => (
  <div style={{ fontSize: 10.5, color: T.ink3, fontFamily: T.sans, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', ...style }}>{children}</div>
);

// ── Form primitives ────────────────────────────────────────────────────────

const TextField = ({ value, onChange, placeholder, mono, autoFocus, onKeyDown, style }) => (
  <input
    value={value || ''}
    onChange={e => onChange && onChange(e.target.value)}
    placeholder={placeholder}
    autoFocus={autoFocus}
    onKeyDown={onKeyDown}
    style={{
      height: 38, padding: '0 12px',
      border: `1px solid ${T.line}`, borderRadius: 6,
      background: T.paper, color: T.ink,
      fontFamily: mono ? T.mono : T.sans, fontSize: 13,
      width: '100%',
      ...style,
    }}
  />
);

const TextArea = ({ value, onChange, placeholder, autoFocus, height = 120, onKeyDown, style }) => (
  <textarea
    value={value || ''}
    onChange={e => onChange && onChange(e.target.value)}
    placeholder={placeholder}
    autoFocus={autoFocus}
    onKeyDown={onKeyDown}
    style={{
      padding: '12px 14px',
      border: `1px solid ${T.line}`, borderRadius: 8,
      background: T.paper, color: T.ink,
      fontFamily: T.sans, fontSize: 13.5, lineHeight: 1.6,
      width: '100%', minHeight: height,
      resize: 'vertical',
      ...style,
    }}
  />
);

const Select = ({ value, onChange, options, mono, style }) => (
  <div style={{ position: 'relative', width: '100%' }}>
    <select
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      style={{
        appearance: 'none',
        height: 38, padding: '0 32px 0 12px',
        border: `1px solid ${T.line}`, borderRadius: 6,
        background: T.paper, color: T.ink,
        fontFamily: mono ? T.mono : T.sans, fontSize: 13,
        width: '100%', cursor: 'pointer',
        ...style,
      }}
    >
      {options.map(o => (
        typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.ink3 }}>
      <Icon k="chevronD" size={14}/>
    </div>
  </div>
);

const FieldRow = ({ label, children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <Label>{label}</Label>
    {children}
    {hint && <div style={{ fontSize: 11.5, color: T.ink3 }}>{hint}</div>}
  </div>
);

// ── Sidebar nav (left, 240px dark navy) ────────────────────────────────────

const NavItem = ({ icon, label, active, count, onClick, hint }) => (
  <div
    onClick={onClick}
    className="nav-item"
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 6,
      background: active ? T.navyAct : 'transparent',
      color: active ? '#fff' : T.navyTxt,
      fontSize: 13.5, fontWeight: active ? 500 : 400,
      cursor: 'pointer',
      letterSpacing: -0.05,
      position: 'relative',
    }}
  >
    {active && <div style={{ position: 'absolute', left: -8, top: 8, bottom: 8, width: 2, background: '#5fa3e8', borderRadius: 1 }}/>}
    <Icon k={icon} size={16} color={active ? '#fff' : T.navyMut}/>
    <span style={{ flex: 1 }}>{label}</span>
    {hint && <span style={{ fontSize: 10.5, color: T.navyMut, fontFamily: T.mono }}>{hint}</span>}
    {count != null && (
      <span style={{
        fontSize: 11, fontFamily: T.mono,
        background: 'rgba(255,255,255,0.08)', color: T.navyTxt,
        padding: '1px 7px', borderRadius: 999,
      }}>{count}</span>
    )}
  </div>
);

const Sidebar = ({ active, activeMode, activeFilter, onNav, onNavFiltered, onNewCase, deadlineCount, pendingCount, draftCount }) => (
  <div style={{
    width: 240, flex: '0 0 240px',
    background: T.navy,
    color: T.navyTxt,
    display: 'flex', flexDirection: 'column',
    borderRight: `1px solid ${T.navyBor}`,
    height: '100vh', position: 'sticky', top: 0,
  }}>
    {/* Brand */}
    <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 7,
        background: 'linear-gradient(180deg, #1e6fcf 0%, #084378 100%)',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 10px rgba(8,67,120,0.4)',
      }}>
        <Icon k="medical" size={17} color="#fff"/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: -0.2 }}>Appeals AI</div>
        <div style={{ fontSize: 10.5, color: T.navyMut, fontFamily: T.mono, marginTop: 1 }}>MSW · INPATIENT</div>
      </div>
    </div>

    <div style={{ height: 1, background: T.navyBor, margin: '4px 16px' }}/>

    {/* Quick action — New case */}
    <div style={{ padding: '12px 14px 6px' }}>
      <button
        onClick={onNewCase}
        className="btn"
        style={{
          width: '100%', height: 36, borderRadius: 6,
          background: '#1e6fcf', color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: T.sans, fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 12px', cursor: 'pointer',
          letterSpacing: -0.05,
          gap: 7,
          boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(0,0,0,0.18)',
        }}
      >
        <Icon k="plus" size={14} color="#fff"/>
        New case
      </button>
    </div>

    {/* Nav sections */}
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflow: 'auto', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem icon="home"    label="Home"      active={active === 'home'}      onClick={() => onNav('home')}/>
        <NavItem icon="gauge"   label="Dashboard" active={active === 'dashboard'} onClick={() => onNav('dashboard')}/>
        <NavItem icon="history" label="History"   active={active === 'history'}   onClick={() => onNav('history')}/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ padding: '0 12px', fontSize: 10.5, color: T.navyMut, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Quick generate</div>
        <NavItem icon="letter" label="Appeal letter"  active={activeMode === 'appeal'} onClick={() => onNewCase('appeal')}/>
        <NavItem icon="note"   label="Clinical note"  active={activeMode === 'note'}   onClick={() => onNewCase('note')}/>
        <NavItem icon="phone"  label="P2P prep"       active={activeMode === 'p2p'}    onClick={() => onNewCase('p2p')}/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ padding: '0 12px', fontSize: 10.5, color: T.navyMut, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Queue</div>
        <NavItem icon="alert"   label="Deadline soon"     active={active === 'history' && activeFilter === 'urgent'} count={deadlineCount} onClick={() => onNavFiltered('urgent')}/>
        <NavItem icon="clock"   label="Awaiting decision" active={active === 'history' && activeFilter === 'filed'}  count={pendingCount}  onClick={() => onNavFiltered('filed')}/>
        <NavItem icon="doc"     label="Drafts"             active={active === 'history' && activeFilter === 'draft'}  count={draftCount}    onClick={() => onNavFiltered('draft')}/>
      </div>
    </div>

    {/* User */}
    <div style={{ borderTop: `1px solid ${T.navyBor}`, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3a8ce0, #084378)', color: '#fff',
          display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 600,
          letterSpacing: 0.3,
        }}>MR</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Maria Rodriguez, MD</div>
          <div style={{ fontSize: 10.5, color: T.navyMut, fontFamily: T.mono, marginTop: 1 }}>HOSPITALIST</div>
        </div>
        <Icon k="kebab" size={14} color={T.navyMut}/>
      </div>
    </div>
  </div>
);

// ── Page header (in main content area; sits under the sidebar) ────────────

const PageHeader = ({ title, eyebrow, onBack, backLabel = 'Home', actions, search, badge }) => (
  <div style={{
    background: T.paper,
    borderBottom: `1px solid ${T.line}`,
    padding: '18px 32px',
    display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      {onBack ? (
        <button
          onClick={onBack}
          className="btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6,
            padding: '4px 10px 4px 8px', cursor: 'pointer',
            color: T.ink2, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500,
            marginBottom: 8,
          }}
        >
          <Icon k="arrowL" size={13} color={T.ink2}/>
          {backLabel}
        </button>
      ) : eyebrow && (
        <div style={{ fontSize: 11, color: T.ink3, fontFamily: T.mono, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>{eyebrow}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, color: T.ink }}>{title}</div>
        {badge}
      </div>
    </div>
    {search && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6,
        padding: '0 12px', height: 34, width: 260,
        color: T.ink3, fontSize: 12.5,
      }}>
        <Icon k="search" size={14} color={T.ink3}/>
        <input
          placeholder="Search cases, ICD-10, insurers…"
          style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 12.5, color: T.ink, fontFamily: T.sans }}
        />
      </div>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {actions}
      <button style={{
        width: 34, height: 34, borderRadius: 6,
        background: T.paper2, border: `1px solid ${T.line}`,
        display: 'grid', placeItems: 'center', cursor: 'pointer',
        position: 'relative',
      }}>
        <Icon k="bell" size={15} color={T.ink2}/>
        <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: T.urgent, border: `1.5px solid ${T.paper2}` }}/>
      </button>
    </div>
  </div>
);

// ── DeID strip (form footnote) ─────────────────────────────────────────────

const DeIdStrip = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11.5, color: T.approved, fontFamily: T.sans,
    background: T.apprSoft, border: `1px solid ${T.apprBor}`,
    borderRadius: 6, padding: '8px 12px',
  }}>
    <Icon k="shield" size={14}/>
    <span style={{ fontWeight: 500 }}>De-identified input only.</span>
    <span style={{ color: T.ink3, fontWeight: 400 }}>No names, MRNs, DOBs, addresses — your text is auto-scanned before submission.</span>
  </div>
);

// ── Toast ──────────────────────────────────────────────────────────────────

const ToastHost = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="toast" style={{
      position: 'fixed', bottom: 24, left: 'calc(50% + 120px)', transform: 'translateX(-50%)',
      background: T.ink, color: T.paper,
      padding: '10px 16px', borderRadius: 8,
      fontSize: 13, fontFamily: T.sans,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
      zIndex: 1000,
    }}>
      <Icon k="check" size={14} color={T.paper}/>
      {toast}
    </div>
  );
};

export { Icon, Btn, StatusBadge, Pill, Mono, Label, TextField, TextArea, Select, FieldRow, Sidebar, NavItem, PageHeader, DeIdStrip, ToastHost };
