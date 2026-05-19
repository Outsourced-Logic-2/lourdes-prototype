// App.jsx — top-level app: state, routing, persistence, generation flow.

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { T } from './theme'
import { Sidebar, ToastHost } from './ui'
import { MODES, SAMPLES, cannedAppeal, cannedNote, cannedP2P, cannedRefineResponses, loadHistory, saveHistory, loadUsage, saveUsage, generateWithClaude, buildResult } from './data.jsx'
import { Home, Dashboard, Input, Generating, Output, History } from './screens'

function deriveCaseLabel(form) {
  // First line of clinical story, shortened.
  const first = (form.story || '').split('\n')[0].trim();
  if (!first) return 'New case';
  return first.length > 60 ? first.slice(0, 60) + '…' : first;
}

function makeHistoryEntry(modeKey, form, result, caseLabel) {
  const m = MODES[modeKey];
  const when = (() => {
    const d = new Date();
    const hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `Today · ${h12}:${mm} ${ampm}`;
  })();
  const tag = modeKey === 'appeal'
    ? `${form.level || 'First-level'}`
    : modeKey === 'note'
    ? `Documentation rewrite`
    : `P2P · ${form.insurer ? form.insurer.split(' ')[0] : 'reviewer'}`;
  // Generate a new claim ID
  const claimId = 'CLM-' + (48300 + Math.floor(Math.random() * 99)).toString();
  return {
    id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    modeKey,
    type: m.historyVerb,
    icon: m.icon,
    when,
    preview: caseLabel,
    tag,
    form,
    result,
    ts: Date.now(),
    status: modeKey === 'p2p' ? 'urgent' : 'filed',
    claimId,
    deadline: '—',
  };
}

// ── Refine: produce a delta on top of an existing result ──────────────────

function applyRefine(result, mode, instruction) {
  // Simple deterministic transformations based on the instruction text.
  // (Real generation uses Claude; this gives us a fast, reliable demo path.)
  const lower = instruction.toLowerCase();
  let summary = cannedRefineResponses[mode].default;
  for (const key of Object.keys(cannedRefineResponses[mode])) {
    if (key !== 'default' && lower.includes(key)) { summary = cannedRefineResponses[mode][key]; break; }
  }

  let next = JSON.parse(JSON.stringify(result));

  if (mode === 'appeal') {
    if (lower.includes('shorter')) {
      // Drop the second-to-last paragraph.
      if (next.paragraphs.length > 4) next.paragraphs.splice(next.paragraphs.length - 2, 1);
    } else if (lower.includes('lactate') || lower.includes('failed outpatient') || lower.includes('icu')) {
      // Append a strengthening sentence to paragraph 3 (index 2).
      const add = lower.includes('icu')
        ? ' The decision to transfer to the ICU within four hours of admission is itself documentation of an escalating intensity-of-service that observation-level care cannot accommodate.'
        : lower.includes('failed outpatient')
        ? ' Prior outpatient antibiotic therapy had already been attempted and failed, as documented in the office records — the inpatient escalation was not elective.'
        : ' The lactate trend from 3.2 to 2.1 over the resuscitation period further confirms the depth of the initial hypoperfusion and the appropriateness of aggressive inpatient management.';
      if (next.paragraphs[2]) next.paragraphs[2] = next.paragraphs[2] + add;
    } else if (lower.includes('cite') || lower.includes('direct')) {
      // Add an extra criterion to the list
      next.criteriaCited = [...(next.criteriaCited || []), ['Add\'l', 'Surviving Sepsis 2021 · 30 mL/kg bolus']];
    }
  } else if (mode === 'note') {
    if (lower.includes('shorter') && next.sections[0]) {
      // shorten HPI by half.
      const half = Math.floor(next.sections[0].body.length / 2);
      const cut = next.sections[0].body.slice(0, half);
      next.sections[0] = { ...next.sections[0], body: cut.replace(/\s+\S*$/, '.') };
    } else if (lower.includes('merge') && next.sections.length > 1) {
      next.sections = [{ h: 'HPI', body: next.sections[0].body + ' ' + next.sections[1].body }, ...next.sections.slice(2)];
    } else if (lower.includes('ros')) {
      next.sections.splice(1, 0, { h: 'Review of systems', body: 'Constitutional: positive for fever, fatigue. Cardiovascular: no chest pain or palpitations. Respiratory: no dyspnea. GU: positive for dysuria. Otherwise negative.' });
    }
  } else if (mode === 'p2p') {
    if (lower.includes('shorter') && next.opener) {
      // halve the opener
      next.opener = next.opener.split('.').slice(0, 2).join('.') + '.';
    } else if (lower.includes('pushback')) {
      next.pushbacks = [...next.pushbacks, { q: '"The fluid resuscitation should have been sufficient."', a: 'Fluid-refractory shock requiring vasopressors meets septic-shock criteria by definition. The fluid response was assessed and was inadequate.' }];
    } else if (lower.includes('phrase')) {
      next.phrases = [...next.phrases, 'sustained vasopressor dependence', 'q1h reassessment requirement', 'monitored setting with escalation capacity'];
    } else if (lower.includes('mcg')) {
      next.arguments = next.arguments.map(a => ({ ...a, ref: a.ref + ' · MCG M-71' }));
    }
  }

  // Refresh ages
  return {
    result: next,
    summary,
  };
}

// ── App root ───────────────────────────────────────────────────────────────

const GENERATING_PHASES_LEN = 5;

function App() {
  const [screen, setScreen]     = useState('home'); // home | dashboard | input | generating | output | history
  const [mode, setMode]         = useState('appeal');
  const [form, setForm]         = useState({
    insurer: 'UnitedHealthcare', level: 'First-level', criteria: 'InterQual',
    setting: 'Inpatient', callTime: 'Today, 2:00 PM',
    story: '', denial: '',
  });
  const [result, setResult]     = useState(null);
  const [caseLabel, setCaseLabel] = useState('');
  const [history, setHistory]   = useState(() => loadHistory());
  const [usage, setUsage]       = useState(() => loadUsage());
  const [generatingPhase, setGeneratingPhase] = useState(0);
  const [generationTime, setGenerationTime] = useState(null);
  const [refineLog, setRefineLog] = useState([]);
  const [refining, setRefining] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [toast, setToast]       = useState(null);
  const cancelRef = useRef(false);

  useEffect(() => { saveHistory(history); }, [history]);
  useEffect(() => { saveUsage(usage); }, [usage]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }, []);

  // ── Nav ──
  const nav = (s) => {
    if (s === 'home') {
      setScreen('home');
      setResult(null);
      setRefineLog([]);
    } else {
      setScreen(s);
    }
  };

  const startNewCase = (modeKey) => {
    setMode(modeKey);
    setForm({
      insurer: 'UnitedHealthcare', level: 'First-level', criteria: 'InterQual',
      setting: 'Inpatient', callTime: 'Today, 2:00 PM',
      story: '', denial: '', sampleId: null,
    });
    setResult(null);
    setRefineLog([]);
    setScreen('input');
  };

  const loadSample = (sample) => {
    setForm(f => ({
      ...f,
      story: sample.story,
      denial: sample.denial,
      insurer: sample.insurer,
      level: sample.level,
      criteria: sample.criteria,
      sampleId: sample.id,
    }));
  };

  // ── Generation flow ──
  const generate = async () => {
    if (cancelRef.current) cancelRef.current = false;
    setScreen('generating');
    setGeneratingPhase(0);
    const t0 = performance.now();

    // Walk through phases visually
    const phaseTimer = setInterval(() => {
      setGeneratingPhase(p => Math.min(p + 1, GENERATING_PHASES_LEN - 1));
    }, 650);

    try {
      let rawResult;
      let usedCanned = false;

      // If user picked a sample, use the canned output for speed/reliability.
      const sample = SAMPLES.find(s => s.id === form.sampleId);
      if (sample) {
        rawResult = mode === 'appeal' ? cannedAppeal(sample)
                  : mode === 'note'   ? cannedNote(sample)
                                      : cannedP2P(sample);
        usedCanned = true;
        // Small "thinking" delay so the loading isn't instant
        await new Promise(r => setTimeout(r, 2200));
      } else {
        try {
          const raw = await generateWithClaude(mode, form);
          // Reuse the sepsis canned criteria as a sensible default if Claude
          // didn't produce its own.
          const fallback = mode === 'appeal' ? cannedAppeal(SAMPLES[0]).criteriaCited
                         : mode === 'note'   ? cannedNote(SAMPLES[0]).criteriaCited
                                              : null;
          rawResult = buildResult(mode, form, raw, fallback);
        } catch (e) {
          console.warn('Claude generation failed, falling back to canned sepsis output', e);
          rawResult = mode === 'appeal' ? cannedAppeal(SAMPLES[0])
                    : mode === 'note'   ? cannedNote(SAMPLES[0])
                                        : cannedP2P(SAMPLES[0]);
          usedCanned = true;
        }
      }

      if (cancelRef.current) { clearInterval(phaseTimer); return; }

      clearInterval(phaseTimer);
      setGeneratingPhase(GENERATING_PHASES_LEN);
      const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
      setGenerationTime(elapsed);

      const label = deriveCaseLabel(form);
      setCaseLabel(label);
      setResult(rawResult);
      setRefineLog([]);
      setCurrentStatus('filed');

      // Add to history (will be visible streaming on output screen)
      const entry = makeHistoryEntry(mode, form, rawResult, label);
      setHistory(h => [entry, ...h].slice(0, 50));
      setUsage(u => u + 1);

      setScreen('output');
    } catch (e) {
      clearInterval(phaseTimer);
      console.error(e);
      setScreen('input');
      showToast('Generation failed — please try again.');
    }
  };

  const cancelGenerate = () => {
    cancelRef.current = true;
    setScreen('input');
  };

  const regenerate = () => {
    // Re-run the same flow.
    setResult(null);
    setRefineLog([]);
    generate();
  };

  const editInputs = () => {
    setScreen('input');
  };

  const refine = async (prompt) => {
    setRefining(true);
    // Bump existing ages
    setRefineLog(log => log.map(r => ({ ...r, age: 'a moment ago' })));
    await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
    const { result: next, summary } = applyRefine(result, mode, prompt);
    setResult(next);
    setRefineLog(log => [...log, { prompt, summary, age: 'just now' }]);
    setRefining(false);
  };

  // ── Copy ──
  const copy = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); showToast(`${label} copied`); } catch {}
      document.body.removeChild(ta);
    }
  };

  // ── Open from history ──
  const openHistoryItem = (row) => {
    setMode(row.modeKey);
    setForm(row.form);
    setResult(row.result);
    setCaseLabel(row.preview);
    setCurrentStatus(row.status);
    setRefineLog([]);
    setGenerationTime(null);
    setScreen('output');
  };

  const clearHistory = () => {
    if (confirm('Clear all history? This cannot be undone.')) {
      setHistory([]);
    }
  };

  // ── Keyboard: Esc to cancel generating ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && screen === 'generating') cancelGenerate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]);

  // ── Render ──
  const pendingCount = history.filter(h => h.status === 'pending' || h.status === 'filed' || h.status === 'urgent').length;
  const draftCount   = history.filter(h => h.status === 'draft').length;
  // (kept for any future place that needs them; sidebar no longer uses)

  // ── Render ──
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
      <Sidebar
        active={screen === 'history' ? 'history' : screen === 'dashboard' ? 'dashboard' : (screen === 'input' || screen === 'generating' || screen === 'output') ? 'generate' : 'home'}
        activeMode={(screen === 'input' || screen === 'generating' || screen === 'output') ? mode : null}
        activeFilter={historyStatusFilter}
        onNav={nav}
        onNavFiltered={(status) => { setHistoryStatusFilter(status); setScreen('history'); }}
        onNewCase={(m) => startNewCase(typeof m === 'string' ? m : 'appeal')}
        deadlineCount={history.filter(h => h.status === 'urgent').length}
        pendingCount={history.filter(h => h.status === 'filed' || h.status === 'pending').length}
        draftCount={history.filter(h => h.status === 'draft').length}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        {screen === 'home' && (
          <Home
            history={history}
            onPickMode={startNewCase}
            onOpenHistory={() => { setHistoryStatusFilter('all'); setScreen('history'); }}
            onOpenHistoryFiltered={(status) => { setHistoryStatusFilter(status); setScreen('history'); }}
            onOpenItem={openHistoryItem}
          />
        )}
        {screen === 'dashboard' && (
          <Dashboard onPickMode={startNewCase}/>
        )}
        {screen === 'input' && (
          <Input
            mode={mode}
            onMode={setMode}
            onBack={() => setScreen('home')}
            form={form}
            setForm={setForm}
            onGenerate={generate}
            onLoadSample={loadSample}
          />
        )}
        {screen === 'generating' && (
          <Generating mode={mode} phase={generatingPhase} onCancel={cancelGenerate}/>
        )}
        {screen === 'output' && result && (
          <Output
            mode={mode}
            result={result}
            refineLog={refineLog}
            refining={refining}
            caseLabel={caseLabel}
            generationTime={generationTime}
            status={currentStatus}
            onCopy={copy}
            onRefine={refine}
            onRegenerate={regenerate}
            onEditInputs={editInputs}
            onNew={() => startNewCase(mode)}
            onBack={editInputs}
          />
        )}
        {screen === 'history' && (
          <History
            history={history}
            onOpen={openHistoryItem}
            onBack={() => setScreen('home')}
            onClear={clearHistory}
            initialStatusFilter={historyStatusFilter}
          />
        )}
      </div>
      <ToastHost toast={toast}/>
    </div>
  );
}

export default App
