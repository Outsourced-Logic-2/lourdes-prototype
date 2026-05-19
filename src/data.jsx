// proto-app.jsx — main interactive prototype.
// Globals from proto-ui.jsx: T, Icon, Btn, Pill, Mono, Label, TextField, TextArea,
// Select, FieldRow, TopBar, DeIdStrip, ToastHost.

import React from 'react';
import { useState, useEffect } from 'react';
import { T } from './theme';

// ── Mode config ────────────────────────────────────────────────────────────

const MODES = {
  appeal: {
    key: 'appeal',
    icon: 'letter',
    title: 'Appeal Letter',
    blurb: 'Generate a formal appeal arguing an insurance denial was wrong, with criteria citations.',
    inputLabel: 'New Appeal Letter',
    generateLabel: 'Generate appeal letter',
    nextLabel: 'New appeal',
    historyVerb: 'Appeal',
  },
  note: {
    key: 'note',
    icon: 'note',
    title: 'Clinical Note',
    blurb: 'Rewrite clinical documentation in criteria-aligned language so it lands the first time.',
    inputLabel: 'New Clinical Note',
    generateLabel: 'Generate clinical note',
    nextLabel: 'New case',
    historyVerb: 'Note',
  },
  p2p: {
    key: 'p2p',
    icon: 'phone',
    title: 'P2P Call Prep',
    blurb: 'Structured cheat sheet for a peer-to-peer call: arguments, counters, key phrases.',
    inputLabel: 'New P2P Call Prep',
    generateLabel: 'Generate P2P prep sheet',
    nextLabel: 'New prep',
    historyVerb: 'P2P',
  },
};

const INSURERS = ['UnitedHealthcare', 'Aetna', 'Anthem BCBS', 'Cigna', 'Humana', 'Medicare', 'Medicaid', 'Other'];
const LEVELS = ['First-level', 'Second-level', 'External review'];
const CRITERIA = ['InterQual', 'MCG', 'CMS Two-Midnight', 'Auto-detect'];
const SETTINGS = ['Inpatient', 'Observation', 'ED', 'Outpatient'];

// ── Sample cases (so the demo "just works" without a Claude round-trip) ────

const SAMPLES = [
  {
    id: 'sepsis',
    label: '67yo F · severe sepsis',
    description: 'Sepsis 2/2 UTI requiring vasopressors, ICU transfer.',
    story: `67yo F with hx of recurrent UTI, presented to ED with 2 days of fever, dysuria, and progressive lethargy. On arrival: T 38.9°C, HR 118, BP 86/52, RR 22. UA gross pyuria, lactate 3.2. Started broad-spectrum abx (cefepime + vanc) and received 30 mL/kg LR bolus. Despite resuscitation, MAP remained <65; norepinephrine initiated within 4 hours of admission, transferred to MICU for ongoing vasopressor support and continuous hemodynamic monitoring.

Cr peaked 2.1 (baseline 0.9), trended down with resuscitation. Blood cx +GNR, urine cx pending. Continued on norepi for 26 hours total before weaning. Discharged HD#5.`,
    denial: `Inpatient stay does not meet medical necessity criteria. Patient could have been managed at observation level of care.`,
    insurer: 'UnitedHealthcare',
    level: 'First-level',
    criteria: 'InterQual',
  },
  {
    id: 'nstemi',
    label: '54yo M · NSTEMI',
    description: 'Troponin I peak 0.84, heparin gtt, cath lab consult.',
    story: `54yo M with HTN, HLD, active smoker, presented with 2h substernal chest pressure radiating to left arm, diaphoresis, nausea. ECG: 1mm ST depression V4-V6. TropI 0.42 → 0.84 → 0.61. Started on ASA 325, ticagrelor 180mg load, heparin gtt at 12 u/kg/hr, high-intensity atorva. Cardiology consulted, plan for cath within 24h. CHA2DS2-VASc not applicable. Monitored on tele in CCU; remained pain-free after morphine x1 and nitro gtt. No arrhythmias. Cath day 2: 90% mid-LAD lesion, DES placed.`,
    denial: `Patient did not require inpatient level of care. Telemetry and serial troponins could have been completed at observation.`,
    insurer: 'Aetna',
    level: 'First-level',
    criteria: 'InterQual',
  },
  {
    id: 'copd',
    label: '71yo M · COPD exac',
    description: 'BiPAP, hypercapnic respiratory failure.',
    story: `71yo M with severe COPD (GOLD D, FEV1 32%), on home 2L O2, presented with 3 days worsening dyspnea, productive cough, low-grade fever. On arrival: RR 28, SpO2 86% on 4L, accessory muscle use. ABG: pH 7.28 / pCO2 62 / pO2 58 on NC. Started BiPAP 14/6, IV solumedrol 125, levofloxacin, duonebs q2h. ABG after 4h BiPAP: 7.34 / 54 / 72. Required BiPAP x 38h before transitioning to high-flow NC, then back to baseline 2L by HD#3.`,
    denial: `Acute respiratory failure not adequately documented to justify inpatient admission. Observation status recommended.`,
    insurer: 'Humana',
    level: 'First-level',
    criteria: 'MCG',
  },
];

// ── Canned outputs (high quality, mode-aware) ──────────────────────────────
// These power the "instant" path when the user picks a sample case.

const cannedAppeal = (s) => ({
  meta: { mode: 'appeal', insurer: s.insurer, level: s.level, criteria: s.criteria },
  letterHeader: {
    to: `Medical Director, ${s.insurer}`,
    from: '[Attending of record]',
    re: 'Appeal of denial — inpatient admission, claim ref: [—]',
    date: 'May 18, 2026',
  },
  paragraphs: s.id === 'sepsis' ? [
    'To the Medical Director,',
    'I am writing on behalf of the treating team to formally appeal the denial of inpatient admission for the patient identified in the attached UM correspondence. The denial cites lack of medical necessity for inpatient level of care. Based on the clinical course documented at admission and the criteria below, the inpatient designation was both appropriate and necessary.',
    'The patient presented with **severe sepsis** secondary to a urinary source, meeting **two SIRS criteria** on arrival (T 38.9°C, HR 118) with a **lactate of 3.2 mmol/L** and SBP transiently to 86 mmHg requiring **30 mL/kg crystalloid resuscitation**. Within four hours of admission, the patient required initiation of **norepinephrine for persistent hypotension**, escalating care to the ICU.',
    'Per **InterQual Acute Adult criteria**, vasopressor requirement for septic shock satisfies the **severity-of-illness threshold** for inpatient admission. The **intensity-of-service** component is satisfied by continuous hemodynamic monitoring, hourly nursing assessments, and broad-spectrum IV antibiotic administration that could not be delivered in an observation or outpatient setting.',
    'The denial appears to have been issued without consideration of the lactate trend or vasopressor initiation documented in the H&P and ICU admission note. We respectfully request that this denial be overturned and the inpatient stay approved as medically necessary.',
    'Documentation supporting this appeal is attached. Please direct any clinical questions to the attending of record.',
    'Sincerely,\n[Attending Name, MD]',
  ] : s.id === 'nstemi' ? [
    'To the Medical Director,',
    'I am writing to formally appeal the denial of inpatient admission for the patient referenced in the attached UM correspondence, who was admitted for **NSTEMI** with documented dynamic ECG changes and rising troponin. The denial states the admission could have been managed at observation level. The clinical course and criteria below demonstrate that inpatient level of care was required from presentation.',
    'The patient presented with **two hours of typical anginal chest pain** with dynamic ECG changes (1 mm ST depression V4–V6) and a **rising troponin I (0.42 → 0.84 ng/mL)**, meeting Type 1 NSTEMI criteria. They were started on dual antiplatelet therapy, a **heparin infusion**, and high-intensity statin, with cardiology consultation for **cardiac catheterization within 24 hours**, per current ACC/AHA guidance for high-risk NSTE-ACS.',
    'Per **InterQual Acute Adult criteria**, an NSTEMI with positive biomarkers and planned invasive evaluation satisfies severity-of-illness for inpatient admission. The **intensity-of-service** component is met by continuous telemetry in a CCU setting, IV anticoagulation, and pre-procedural management that cannot be safely delivered at observation level.',
    'Cardiac catheterization on hospital day two confirmed a **90% mid-LAD lesion** with DES placement, validating the initial high-risk designation. Downgrading this episode to observation retrospectively misrepresents both the diagnostic certainty at admission and the standard of care for high-risk ACS.',
    'We respectfully request that this denial be overturned and the inpatient stay approved as medically necessary. Documentation supporting this appeal is attached.',
    'Sincerely,\n[Attending Name, MD]',
  ] : [
    'To the Medical Director,',
    'I am writing to formally appeal the denial of inpatient admission for the patient referenced in the attached UM correspondence, who was admitted for **acute hypercapnic respiratory failure** secondary to a severe COPD exacerbation. The denial states inpatient admission was not adequately supported. The clinical course and criteria below demonstrate that inpatient level of care was both appropriate and necessary.',
    'The patient is a 71-year-old with severe baseline COPD (GOLD D, FEV1 32%) on home oxygen, presenting with three days of worsening dyspnea and a productive cough. On arrival the patient was in **acute hypercapnic respiratory failure** (ABG pH 7.28 / pCO₂ 62 / pO₂ 58 on supplemental oxygen) with accessory muscle use and an SpO₂ of 86%. **BiPAP was initiated emergently** along with IV corticosteroids, IV antibiotics, and continuous bronchodilator therapy.',
    'Per **MCG Inpatient & Surgical Care criteria** for COPD exacerbation, **non-invasive positive pressure ventilation requirement with documented hypercapnia (pCO₂ > 45 with pH < 7.35)** satisfies severity-of-illness for inpatient admission. The **intensity-of-service** component is met by continuous respiratory monitoring, IV-only therapeutics, and the need for NIV titration that cannot be delivered at observation or floor level without escalation capacity.',
    'The patient required **38 hours of BiPAP** before transitioning to high-flow nasal cannula, with serial ABGs documenting gradual resolution of the respiratory acidosis. Discharging this case to observation would have created a clinically unsafe pathway and is inconsistent with both MCG criteria and current GOLD recommendations for severe exacerbations.',
    'We respectfully request that this denial be overturned and the inpatient stay approved as medically necessary. Documentation supporting this appeal is attached.',
    'Sincerely,\n[Attending Name, MD]',
  ],
  criteriaCited: s.id === 'sepsis' ? [
    ['InterQual', 'Acute Adult · Sepsis SI/IS'],
    ['Severity',  'Vasopressor req. for septic shock'],
    ['Intensity', 'Continuous hemodynamic monitoring'],
  ] : s.id === 'nstemi' ? [
    ['InterQual', 'Acute Adult · NSTE-ACS SI/IS'],
    ['Severity',  'Positive troponin + dynamic ECG'],
    ['Intensity', 'Heparin gtt + planned cath ≤24h'],
  ] : [
    ['MCG',       'M-50 · COPD exacerbation'],
    ['Severity',  'Hypercapnic resp. failure (pH 7.28 / pCO₂ 62)'],
    ['Intensity', 'BiPAP + IV steroids + IV abx'],
  ],
});

const cannedNote = (s) => ({
  meta: { mode: 'note', setting: 'Inpatient', criteria: s.criteria },
  sections: s.id === 'sepsis' ? [
    { h: 'HPI', body: '67-year-old female with a history of recurrent urinary tract infection presenting with two days of fever, dysuria, and progressive lethargy. On arrival to the emergency department: **T 38.9°C, HR 118, BP 86/52, RR 22**, SpO₂ 94% on room air. Urinalysis with gross pyuria. Initial **lactate 3.2 mmol/L**.' },
    { h: 'Pertinent exam', body: 'Ill-appearing, tachycardic, suprapubic and right CVA tenderness. Lungs clear. Mental status intact but fatigued. No focal neurologic deficit.' },
    { h: 'Labs / data', body: 'WBC 18.4 with left shift. **Lactate 3.2 → 2.1** after resuscitation. **Cr 2.1 (baseline 0.9)**. Blood cultures pending — **gram-negative rods at 12 hours**. UA with >100 WBC/hpf, leukocyte esterase positive, nitrites positive.' },
    { h: 'Assessment', body: '**Severe sepsis** secondary to urinary source with **vasopressor requirement** and acute kidney injury. Meets **InterQual Acute Adult severity-of-illness criteria** via persistent hypotension requiring vasopressor support following **30 mL/kg crystalloid resuscitation**.' },
    { h: 'Plan / level of care', body: '**ICU admission** for **continuous hemodynamic monitoring** and norepinephrine titration. Broad-spectrum IV antibiotics (cefepime + vancomycin) pending culture sensitivities. Aggressive volume resuscitation with reassessment q1h. **Intensity-of-service criteria met** by continuous monitoring, hourly nursing assessments, and IV-only therapeutics that cannot be delivered at observation level.' },
  ] : s.id === 'nstemi' ? [
    { h: 'HPI', body: '54-year-old male with hypertension, hyperlipidemia, and active tobacco use presenting with two hours of **substernal chest pressure** radiating to the left arm with diaphoresis and nausea. Symptoms ongoing on arrival.' },
    { h: 'Pertinent exam', body: 'Diaphoretic, mildly anxious. Lungs clear. Heart rate regular, no murmur. No JVD, no peripheral edema. Distal pulses intact.' },
    { h: 'Labs / data', body: 'ECG: **1 mm ST depression V4–V6**, no Q waves. **Troponin I 0.42 → 0.84 → 0.61 ng/mL**. CBC, BMP within normal limits. CK-MB elevated. CXR clear.' },
    { h: 'Assessment', body: '**Type 1 NSTEMI** with dynamic ECG changes and rising biomarkers, high-risk by TIMI / GRACE. Meets **InterQual NSTE-ACS severity-of-illness** via positive troponin with ischemic ECG changes.' },
    { h: 'Plan / level of care', body: 'CCU admission with continuous telemetry. DAPT (ASA 325 + ticagrelor 180 load), **heparin infusion** at 12 u/kg/hr, high-intensity atorvastatin. **Cardiac catheterization within 24 hours** per ACC/AHA. Intensity-of-service met by IV anticoagulation and pre-procedural monitoring not available at observation level.' },
  ] : [
    { h: 'HPI', body: '71-year-old male with severe COPD (**GOLD D, FEV1 32%**), on home 2 L oxygen, presenting with three days of worsening dyspnea, productive cough, and low-grade fever. On arrival: RR 28, SpO₂ 86% on 4 L NC, accessory muscle use.' },
    { h: 'Pertinent exam', body: 'In moderate respiratory distress. Tripoding, pursed-lip breathing, diffuse wheezing with prolonged expiratory phase. No peripheral edema. Mental status intact.' },
    { h: 'Labs / data', body: 'ABG on arrival: **pH 7.28 / pCO₂ 62 / pO₂ 58** on 4 L NC. WBC 12.1. CXR: hyperinflation, no consolidation. ABG after 4 h BiPAP: 7.34 / 54 / 72.' },
    { h: 'Assessment', body: '**Acute hypercapnic respiratory failure** secondary to severe COPD exacerbation. Meets **MCG Inpatient criteria** via **NIV requirement with documented hypercapnia**.' },
    { h: 'Plan / level of care', body: 'Inpatient admission with continuous respiratory monitoring. **BiPAP 14/6** titrated to ABG. IV solumedrol 125 mg q6h, levofloxacin, continuous bronchodilator therapy. Intensity-of-service met by NIV titration and continuous monitoring that cannot be delivered at observation level.' },
  ],
  criteriaCited: s.id === 'sepsis' ? [
    ['SI', 'Vasopressor requirement for septic shock ✓'],
    ['SI', 'Lactate >2 + persistent hypotension ✓'],
    ['IS', 'Continuous hemodynamic monitoring ✓'],
    ['IS', 'IV-only therapeutics ✓'],
  ] : s.id === 'nstemi' ? [
    ['SI', 'Positive troponin with dynamic ECG ✓'],
    ['SI', 'High-risk ACS, planned PCI ≤24h ✓'],
    ['IS', 'IV anticoagulation (heparin gtt) ✓'],
    ['IS', 'Continuous telemetry in CCU ✓'],
  ] : [
    ['SI', 'Hypercapnic respiratory failure ✓'],
    ['SI', 'NIV requirement with pCO₂ > 45 ✓'],
    ['IS', 'BiPAP titration ✓'],
    ['IS', 'IV steroids + IV antibiotics ✓'],
  ],
});

const cannedP2P = (s) => ({
  meta: { mode: 'p2p', insurer: s.insurer, criteria: s.criteria, callIn: '00:47:12' },
  opener: s.id === 'sepsis'
    ? `This is a 67-year-old patient who arrived in septic shock with a lactate of 3.2 and required **vasopressor support within four hours of admission**. By InterQual, vasopressor requirement for septic shock satisfies severity-of-illness for inpatient — this was not an observation-level case at any point.`
    : s.id === 'nstemi'
    ? `This is a 54-year-old patient with a Type 1 NSTEMI: rising troponin 0.42 to 0.84 with dynamic ECG changes, started on **heparin gtt with cath planned within 24 hours**. By InterQual, positive troponin with ischemic ECG meets severity-of-illness for inpatient — this is high-risk ACS, not an observation case.`
    : `This is a 71-year-old patient with severe COPD who presented in **acute hypercapnic respiratory failure** — pH 7.28, pCO₂ 62 — and required BiPAP. By MCG, hypercapnic respiratory failure with NIV requirement satisfies severity-of-illness for inpatient. Observation cannot deliver NIV titration.`,
  arguments: s.id === 'sepsis' ? [
    { tag: 'SI', body: 'Persistent hypotension requiring norepinephrine following 30 mL/kg crystalloid resuscitation.', ref: 'InterQual AA · Sepsis SI-1' },
    { tag: 'SI', body: 'Lactate 3.2 with end-organ hypoperfusion (AKI: Cr 2.1, baseline 0.9).', ref: 'InterQual AA · Sepsis SI-3' },
    { tag: 'IS', body: 'Continuous hemodynamic monitoring + hourly nursing + IV-only therapeutics.', ref: 'InterQual AA · IS' },
  ] : s.id === 'nstemi' ? [
    { tag: 'SI', body: 'Rising troponin (0.42 → 0.84) with 1 mm ST depression V4–V6.', ref: 'InterQual AA · NSTE-ACS SI-1' },
    { tag: 'SI', body: 'High-risk ACS with planned cath ≤24 hours per ACC/AHA.', ref: 'ACC/AHA 2023 NSTE-ACS' },
    { tag: 'IS', body: 'IV anticoagulation (heparin gtt) and continuous telemetry in CCU.', ref: 'InterQual AA · IS' },
  ] : [
    { tag: 'SI', body: 'Hypercapnic respiratory failure: pH 7.28 / pCO₂ 62 on arrival.', ref: 'MCG M-50 · SI' },
    { tag: 'SI', body: 'NIV requirement (BiPAP 14/6) sustained for 38 hours.', ref: 'MCG M-50 · SI' },
    { tag: 'IS', body: 'Continuous respiratory monitoring + IV-only therapeutics.', ref: 'MCG M-50 · IS' },
  ],
  pushbacks: s.id === 'sepsis' ? [
    { q: '"Patient was hemodynamically stable after the first liter."', a: 'MAP transiently rose with bolus but trended back to 58 within 90 min — that\'s why norepi was started. The fluid response was not sustained.' },
    { q: '"This could have been managed in observation."', a: 'Observation does not support continuous vasopressor titration or q1h nursing reassessment. There is no observation-level pathway for septic shock.' },
    { q: '"Lactate cleared with resuscitation."', a: 'Lactate clearance is a treatment response, not a marker of avoided severity. The patient still required pressors for 26 hours.' },
  ] : s.id === 'nstemi' ? [
    { q: '"Troponin elevation was modest."', a: 'Type 1 NSTEMI is defined by a rise and/or fall pattern with ischemic symptoms — the magnitude is not the threshold. The dynamic ECG changes confirm acute ischemia.' },
    { q: '"Could have observed and trended troponins."', a: 'High-risk ACS with planned invasive evaluation within 24 hours requires inpatient monitoring per ACC/AHA. Observation does not support IV anticoagulation pre-cath.' },
    { q: '"Patient was pain-free on arrival."', a: 'Symptom resolution after nitro and morphine does not reduce risk — the LAD lesion identified on cath confirms the underlying culprit.' },
  ] : [
    { q: '"ABG improved quickly on BiPAP."', a: 'Improvement is the treatment response, not evidence the admission was unnecessary. The patient required 38 hours of NIV before weaning.' },
    { q: '"Could have managed on floor with high-flow."', a: 'pH < 7.35 with rising pCO₂ on arrival meets criteria for NIV, which requires monitored setting with escalation capacity — not standard floor or observation.' },
    { q: '"No infectious infiltrate on CXR."', a: 'COPD exacerbations are clinical; CXR is to rule out alternatives. IV steroids and abx were started based on the GOLD-D phenotype and presentation.' },
  ],
  data: s.id === 'sepsis' ? [
    ['On arrival', 'T 38.9, HR 118, BP 86/52, RR 22, lact 3.2'],
    ['After 30 mL/kg', 'MAP 58, lact 2.9 — pressors started'],
    ['ICU course', 'Norepi 26h max 0.18 mcg/kg/min'],
    ['Renal', 'Cr 0.9 → 2.1 → 1.2 by HD#4'],
  ] : s.id === 'nstemi' ? [
    ['On arrival', '2h CP, ECG 1mm ST↓ V4–V6'],
    ['Trop I', '0.42 → 0.84 → 0.61 ng/mL'],
    ['Meds started', 'ASA, ticagrelor 180, heparin gtt'],
    ['Cath day 2', '90% mid-LAD, DES placed'],
  ] : [
    ['On arrival', 'RR 28, SpO₂ 86% on 4L, accessory muscle use'],
    ['ABG #1', 'pH 7.28 / pCO₂ 62 / pO₂ 58'],
    ['On BiPAP 4h', 'pH 7.34 / pCO₂ 54 / pO₂ 72'],
    ['NIV duration', '38h before high-flow transition'],
  ],
  phrases: s.id === 'sepsis' ? [
    'meets severity-of-illness via vasopressor requirement',
    'no observation pathway for septic shock',
    'continuous hemodynamic monitoring',
    '30 mL/kg per Surviving Sepsis',
    'end-organ hypoperfusion',
    'IV-only therapeutics not deliverable at obs level',
  ] : s.id === 'nstemi' ? [
    'Type 1 NSTEMI with dynamic ECG',
    'rising and falling troponin pattern',
    'planned invasive evaluation ≤24h',
    'continuous telemetry in CCU',
    'IV anticoagulation pre-cath',
    'high-risk NSTE-ACS per ACC/AHA',
  ] : [
    'acute hypercapnic respiratory failure',
    'NIV requirement with pCO₂ > 45',
    'GOLD-D phenotype',
    'continuous respiratory monitoring',
    'no NIV titration at observation level',
    'severe baseline obstruction (FEV1 32%)',
  ],
});

// ── Refine-message canned responses ────────────────────────────────────────

const cannedRefineResponses = {
  appeal: {
    'shorter': 'Condensed letter to three core paragraphs.',
    'cite-heavy': 'Added two additional InterQual sub-criteria references.',
    'lactate': 'Strengthened argument around lactate trend and resuscitation response.',
    'icu transfer': 'Added explicit framing of ICU transfer as escalation-of-care evidence.',
    'failed outpatient': 'Added paragraph on failed outpatient management.',
    'default': 'Revised paragraph 3 with stronger criteria-aligned framing.',
  },
  note: {
    'shorter': 'Compressed HPI and Pertinent exam.',
    'merge': 'Merged HPI and Pertinent exam into a single section.',
    'ros': 'Added Review of Systems section.',
    'cite': 'Tightened criteria language in Assessment.',
    'default': 'Reorganized note for criteria alignment.',
  },
  p2p: {
    'shorter': 'Tightened opener to 25 seconds.',
    'pushback': 'Added pushback on fluid responsiveness.',
    'phrases': 'Added three additional landing phrases.',
    'mcg': 'Added MCG cross-references alongside InterQual.',
    'default': 'Added an extra anticipated pushback.',
  },
};

// ── Local storage helpers ──────────────────────────────────────────────────

const HISTORY_KEY = 'lourdes.history.v3';
const USAGE_KEY = 'lourdes.usage.v1';

// Seed history shown on first load (or when user clears it). Each entry is
// a full case envelope so the user can click "Reopen" and land on the
// streaming output screen with the rendered content.
const SEED_HISTORY = () => {
  const sepsis  = SAMPLES.find(s => s.id === 'sepsis');
  const nstemi  = SAMPLES.find(s => s.id === 'nstemi');
  const copd    = SAMPLES.find(s => s.id === 'copd');

  const mk = (id, modeKey, when, label, tag, form, result, status, claimId, deadline) => ({
    id, modeKey, when, preview: label, tag,
    type: MODES[modeKey].historyVerb,
    icon: MODES[modeKey].icon,
    form, result, ts: Date.now() - 1,
    status, claimId, deadline,
  });

  // Build forms for canned outputs we generate from the three samples.
  const formFor = (s, overrides = {}) => ({
    ...s, story: s.story, denial: s.denial,
    insurer: s.insurer, level: s.level, criteria: s.criteria,
    sampleId: s.id,
    ...overrides,
  });

  return [
    // ── today ──
    mk('seed-1', 'appeal', 'Today · 11:24 AM',
       '67yo F · severe sepsis 2/2 UTI · ICU transfer for vasopressor support',
       'Medical necessity',
       formFor(sepsis), cannedAppeal(sepsis),
       'filed', 'CLM-48201', 'May 22'),
    mk('seed-2', 'appeal', 'Today · 10:51 AM',
       '54yo M · NSTEMI · troponin I 0.84 · heparin + cath',
       'Level of care',
       formFor(nstemi), cannedAppeal(nstemi),
       'filed', 'CLM-48198', 'May 21'),
    mk('seed-3', 'p2p',    'Today · 9:33 AM',
       '71yo M · COPD exac on BiPAP · ABG 7.28 / 62 / 58',
       'Reviewer call 2:00 PM',
       formFor(copd, { callTime: 'Today, 2:00 PM' }), cannedP2P(copd),
       'urgent', 'CLM-48155', 'Today'),
    mk('seed-4', 'appeal', 'Today · 8:47 AM',
       '49yo M · DKA · glucose 612 · AG 22 · insulin gtt',
       'Observation → inpatient',
       formFor(sepsis, { insurer: 'Cigna', level: 'First-level' }),
       cannedAppeal(sepsis),
       'pending', 'CLM-48142', 'May 24'),

    // ── yesterday ──
    mk('seed-5', 'appeal', 'Yesterday · 4:12 PM',
       '38yo F · pyelonephritis · failed PO cipro · lactate 2.8',
       'Medical necessity',
       formFor(sepsis), cannedAppeal(sepsis),
       'overturned', 'CLM-48088', '—'),
    mk('seed-6', 'note',   'Yesterday · 2:48 PM',
       '82yo M · fall with SDH · GCS 14 · neuro checks q1h',
       'Documentation rewrite',
       formFor(nstemi, { setting: 'Inpatient' }), cannedNote(nstemi),
       'draft', 'CLM-48091', 'May 23'),
    mk('seed-7', 'appeal', 'Yesterday · 11:09 AM',
       '76yo F · CHF exacerbation · BNP 4,820 · IV diuresis',
       'Level of care',
       formFor(copd, { insurer: 'Anthem BCBS' }), cannedAppeal(copd),
       'approved', 'CLM-48064', '—'),
    mk('seed-8', 'appeal', 'Yesterday · 9:21 AM',
       '45yo F · acute pancreatitis · lipase 1,420 · IV n/v',
       'Second-level appeal',
       formFor(nstemi, { insurer: 'Aetna', level: 'Second-level' }),
       cannedAppeal(nstemi),
       'pending', 'CLM-48050', 'May 25'),

    // ── earlier this week ──
    mk('seed-9',  'p2p',    'May 16 · 1:15 PM',
       '63yo M · AFib RVR rate 162 · dilt gtt · failed PO load',
       'P2P · Cigna, 4pm',
       formFor(copd, { insurer: 'Cigna', callTime: 'May 16, 4:00 PM' }),
       cannedP2P(copd),
       'overturned', 'CLM-47998', '—'),
    mk('seed-10', 'appeal', 'May 16 · 10:34 AM',
       '70yo M · PE on CTA · apixaban · sat 88% RA',
       'Level of care',
       formFor(copd, { insurer: 'UnitedHealthcare' }), cannedAppeal(copd),
       'overturned', 'CLM-47987', '—'),
    mk('seed-11', 'appeal', 'May 15 · 3:55 PM',
       '52yo F · cellulitis with abscess · failed PO abx · IV vanc',
       'Medical necessity',
       formFor(sepsis, { insurer: 'Humana' }), cannedAppeal(sepsis),
       'overturned', 'CLM-47931', '—'),
    mk('seed-12', 'note',   'May 15 · 11:02 AM',
       '59yo F · HTN crisis · BP 232/118 · IV nicardipine gtt',
       'Documentation rewrite',
       formFor(nstemi), cannedNote(nstemi),
       'filed', 'CLM-47914', '—'),

    // ── last week ──
    mk('seed-13', 'appeal', 'May 13 · 4:48 PM',
       '68yo M · upper GI bleed · Hgb 6.4 · 3u PRBC · EGD pending',
       'Medical necessity',
       formFor(nstemi, { insurer: 'Aetna' }), cannedAppeal(nstemi),
       'overturned', 'CLM-47808', '—'),
    mk('seed-14', 'appeal', 'May 13 · 9:17 AM',
       '34yo F · status migrainosus · failed outpatient triptan + toradol',
       'Observation → inpatient',
       formFor(copd, { insurer: 'Anthem BCBS' }), cannedAppeal(copd),
       'denied', 'CLM-47795', '—'),
    mk('seed-15', 'p2p',    'May 12 · 2:00 PM',
       '81yo F · ischemic stroke · NIHSS 8 · tPA candidate',
       'P2P · UHC, escalated',
       formFor(sepsis, { callTime: 'May 12, 2:00 PM' }), cannedP2P(sepsis),
       'overturned', 'CLM-47742', '—'),
  ];
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw === null) return SEED_HISTORY();  // first load → seed
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_HISTORY();
  } catch { return SEED_HISTORY(); }
};
const saveHistory = (h) => localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
const loadUsage = () => parseInt(localStorage.getItem(USAGE_KEY) || '34', 10);
const saveUsage = (n) => localStorage.setItem(USAGE_KEY, String(n));

// Markdown-ish: **bold** → semibold emphasis (no highlight background).
const renderInline = (text) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} style={{ color: T.ink, fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
};

const plainText = (text) => String(text).replace(/\*\*([^*]+)\*\*/g, '$1');

// ── Streaming helpers ──────────────────────────────────────────────────────
// We progressively reveal canned content for a "live generation" feel.

function useStreamReveal(content, onDone) {
  // content is the whole result; we expose a `progress` (0..1) that grows
  // and a derived `partial` shape. For paragraph-style outputs we reveal
  // by character; for sectioned outputs (note, p2p), by section.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!content) { setProgress(0); return; }
    setProgress(0);
    let p = 0;
    const total = 2400;       // ms
    const tick  = 32;
    const inc   = tick / total;
    const id = setInterval(() => {
      p += inc + Math.random() * inc * 0.4;
      if (p >= 1) { p = 1; setProgress(1); clearInterval(id); onDone && onDone(); }
      else setProgress(p);
    }, tick);
    return () => clearInterval(id);
  }, [content]);
  return progress;
}

// ── Real-Claude generation (fallback path) ────────────────────────────────

async function generateWithClaude(mode, form) {
  // Ask Claude for a strictly-shaped JSON response. We keep prompts tight
  // because window.claude.complete is capped at 1024 output tokens.
  const sys =
    mode === 'appeal' ? `You produce concise insurance-appeal letters for clinicians. Return strict JSON: {paragraphs: string[6-7]}. Salutation "To the Medical Director," is paragraph 1. Close with "Sincerely,\\n[Attending Name, MD]". Use **bold** around criteria-aligned phrases. Reference InterQual / MCG by name where appropriate. Do NOT include PHI. Maximum 220 words total.` :
    mode === 'note' ? `You rewrite clinical notes in criteria-aligned language. Return strict JSON: {sections: [{h: string, body: string}]} with sections h ∈ ["HPI","Pertinent exam","Labs / data","Assessment","Plan / level of care"]. Use **bold** around criteria-aligned phrases. Do NOT include PHI. Maximum 220 words total.` :
    `You produce structured peer-to-peer call prep sheets. Return strict JSON: {opener: string, arguments: [{tag: "SI"|"IS", body: string, ref: string}], pushbacks: [{q: string, a: string}], data: [[label, value]], phrases: string[]}. Keep opener under 70 words, 3 arguments, 3 pushbacks, 4 data rows, 5-6 phrases. Use **bold** in opener around criteria-aligned phrases. Do NOT include PHI. Maximum 280 words total.`;

  const userMsg = `Case context:
Insurer: ${form.insurer || 'unspecified'}
Appeal level: ${form.level || 'unspecified'}
Criteria framework: ${form.criteria || 'InterQual'}
Setting: ${form.setting || 'Inpatient'}

Denial reason:
${form.denial || '(none specified)'}

Clinical story:
${form.story}

Return ONLY the JSON object, no surrounding prose.`;

  const response = await window.claude.complete({
    messages: [
      { role: 'user', content: sys + '\n\n' + userMsg },
    ],
  });

  // Extract JSON
  let jsonStr = response;
  const m = response.match(/\{[\s\S]*\}/);
  if (m) jsonStr = m[0];
  return JSON.parse(jsonStr);
}

// Build a result envelope from raw Claude content (or canned) ──────────────
function buildResult(mode, form, raw, fallbackCriteria) {
  const baseMeta = {
    mode, insurer: form.insurer, level: form.level, criteria: form.criteria,
    setting: form.setting, ts: Date.now(),
  };
  if (mode === 'appeal') {
    return {
      meta: baseMeta,
      letterHeader: {
        to: `Medical Director, ${form.insurer || '[Insurer]'}`,
        from: '[Attending of record]',
        re: 'Appeal of denial — inpatient admission, claim ref: [—]',
        date: 'May 18, 2026',
      },
      paragraphs: raw.paragraphs || [],
      criteriaCited: fallbackCriteria || [
        [form.criteria || 'InterQual', 'Acute Adult criteria'],
        ['Severity', 'See letter for cited findings'],
        ['Intensity', 'IV-only therapeutics + monitoring'],
      ],
    };
  }
  if (mode === 'note') {
    return {
      meta: baseMeta,
      sections: raw.sections || [],
      criteriaCited: fallbackCriteria || [
        ['SI', 'See note for cited findings ✓'],
        ['IS', 'Continuous monitoring documented ✓'],
      ],
    };
  }
  return {
    meta: { ...baseMeta, callIn: '00:47:12' },
    opener: raw.opener || '',
    arguments: raw.arguments || [],
    pushbacks: raw.pushbacks || [],
    data: raw.data || [],
    phrases: raw.phrases || [],
  };
}

export { MODES, INSURERS, LEVELS, CRITERIA, SETTINGS, SAMPLES, cannedAppeal, cannedNote, cannedP2P, cannedRefineResponses, loadHistory, saveHistory, loadUsage, saveUsage, renderInline, plainText, useStreamReveal, generateWithClaude, buildResult };
