import React, { useEffect, useMemo, useState } from "react";

/**
 * LTTI — LeToast Type Indicator (Auto‑scoring Web App)
 * #ToastR5.6
 *
 * Features
 * - 120 questions (Likert 1–5) auto-scored into a 4-letter LTTI code
 * - Randomized order per session (but stable until reset)
 * - Paged form (10 pages × 12 questions) with progress & autosave (localStorage)
 * - Instant result: family, code, profile label & short tagline
 * - Export: print-friendly result (use browser Print ➜ Save as PDF)
 *
 * How to use
 * - Drop this component in a Next.js / CRA project and render <LTTIApp />
 * - Tailwind recommended (classes included). Remove if not using Tailwind
 */

// ---- Types

type Axis = "energy" | "action" | "cognition" | "control";
// Letters per axis
// energy: I vs E
// action: S (Sous-trading) vs O? historically O = Overtrading, but we use T for Surtrading in labels.
// For scoring, we keep letters I/E, S/T, R/X, D/C.

type Letter = "I" | "E" | "S" | "T" | "R" | "X" | "D" | "C";

interface QuestionItem {
  id: number; // 1..120
  text: string;
  axis: Axis;
  // which side this item supports when the user picks a higher score
  // e.g. target = "I" means value 1..5 adds to I sum
  target: Letter;
}

// ---- Question bank (120)
// Source: User-approved list, mapped to targets per axis.

const Q: QuestionItem[] = [
  // AXIS 1 — ENERGY (I vs E)
  { id: 1, text: "J’aime trader seul, sans partager mes idées avec d’autres.", axis: "energy", target: "I" },
  { id: 2, text: "Je me sens plus confiant lorsque je partage mes trades avec une communauté.", axis: "energy", target: "E" },
  { id: 3, text: "Après plusieurs trades, j’ai besoin d’un moment seul pour me ressourcer.", axis: "energy", target: "I" },
  { id: 4, text: "Je me sens stimulé quand je parle de mes positions avec d’autres traders.", axis: "energy", target: "E" },
  { id: 5, text: "Je préfère lire et analyser en silence plutôt que discuter en direct.", axis: "energy", target: "I" },
  { id: 6, text: "Quand je gagne, j’ai envie de le dire tout de suite à quelqu’un.", axis: "energy", target: "E" },
  { id: 7, text: "Je suis à l’aise dans le fait d’être invisible sur le marché, sans reconnaissance.", axis: "energy", target: "I" },
  { id: 8, text: "J’ai besoin qu’on remarque mes réussites.", axis: "energy", target: "E" },
  { id: 9, text: "Je trouve que la solitude renforce ma lucidité.", axis: "energy", target: "I" },
  { id: 10, text: "Je trouve que l’énergie du groupe renforce mon engagement.", axis: "energy", target: "E" },
  { id: 11, text: "Quand je perds, je garde mes émotions pour moi.", axis: "energy", target: "I" },
  { id: 12, text: "Quand je gagne, j’ai tendance à l’exprimer bruyamment.", axis: "energy", target: "E" },
  { id: 13, text: "Mes proches savent rarement ce que j’ai ressenti après une journée de trading.", axis: "energy", target: "I" },
  { id: 14, text: "J’aime célébrer mes victoires avec d’autres.", axis: "energy", target: "E" },
  { id: 15, text: "J’intériorise mes frustrations sans en parler.", axis: "energy", target: "I" },
  { id: 16, text: "J’ai besoin de partager mes émotions, même négatives, après une perte.", axis: "energy", target: "E" },
  { id: 17, text: "Je garde mes pensées pour moi tant qu’elles ne sont pas structurées.", axis: "energy", target: "I" },
  { id: 18, text: "Je parle souvent à voix haute de ce que je ressens face au marché.", axis: "energy", target: "E" },
  { id: 19, text: "Je trouve qu’exprimer mes émotions brouille mon jugement.", axis: "energy", target: "I" },
  { id: 20, text: "Je trouve qu’exprimer mes émotions me libère et me clarifie.", axis: "energy", target: "E" },
  { id: 21, text: "Je préfère attendre avant de prendre une décision de trade.", axis: "energy", target: "I" },
  { id: 22, text: "J’aime être le premier à cliquer quand une opportunité se présente.", axis: "energy", target: "E" },
  { id: 23, text: "Je préfère laisser d’autres s’engager avant moi.", axis: "energy", target: "I" },
  { id: 24, text: "J’aime prendre les devants même si je n’ai pas toutes les infos.", axis: "energy", target: "E" },
  { id: 25, text: "Je me sens plus à l’aise dans une posture d’observateur.", axis: "energy", target: "I" },
  { id: 26, text: "Je me sens plus à l’aise dans une posture d’acteur direct.", axis: "energy", target: "E" },
  { id: 27, text: "Je préfère réfléchir longtemps avant d’agir.", axis: "energy", target: "I" },
  { id: 28, text: "Je préfère agir vite et réfléchir ensuite.", axis: "energy", target: "E" },
  { id: 29, text: "Je crois que la patience est une force.", axis: "energy", target: "I" },
  { id: 30, text: "Je crois que la vitesse est une force.", axis: "energy", target: "E" },
  // AXIS 2 — ACTION (S vs T)
  { id: 31, text: "J’évite de trader si je ne suis pas certain.", axis: "action", target: "S" },
  { id: 32, text: "Je prends volontiers un trade même avec de l’incertitude.", axis: "action", target: "T" },
  { id: 33, text: "Je préfère passer à côté que d’entrer trop tôt.", axis: "action", target: "S" },
  { id: 34, text: "Je préfère entrer trop tôt que de passer à côté.", axis: "action", target: "T" },
  { id: 35, text: "Je préfère attendre plusieurs confirmations.", axis: "action", target: "S" },
  { id: 36, text: "Je préfère capturer l’opportunité rapidement quitte à me tromper.", axis: "action", target: "T" },
  { id: 37, text: "Je ressens du stress si je clique trop souvent.", axis: "action", target: "S" },
  { id: 38, text: "Je ressens du stress si je ne clique pas assez.", axis: "action", target: "T" },
  { id: 39, text: "Je trouve normal de trader peu souvent.", axis: "action", target: "S" },
  { id: 40, text: "Je trouve normal de trader très souvent.", axis: "action", target: "T" },
  { id: 41, text: "Je laisse souvent passer des trades par prudence.", axis: "action", target: "S" },
  { id: 42, text: "Je déteste laisser filer une opportunité.", axis: "action", target: "T" },
  { id: 43, text: "Je pense que peu de trades suffisent pour performer.", axis: "action", target: "S" },
  { id: 44, text: "Je pense qu’il faut être très actif pour performer.", axis: "action", target: "T" },
  { id: 45, text: "Je préfère filtrer au maximum les setups.", axis: "action", target: "S" },
  { id: 46, text: "Je préfère multiplier les setups pour ne rien rater.", axis: "action", target: "T" },
  { id: 47, text: "Je me sens frustré si je n’ai pas cliqué de la journée.", axis: "action", target: "T" },
  { id: 48, text: "Je me sens rassuré même avec zéro trade.", axis: "action", target: "S" },
  { id: 49, text: "J’ai l’impression que chaque opportunité ratée est une perte.", axis: "action", target: "T" },
  { id: 50, text: "J’ai l’impression que rater un trade ne change rien.", axis: "action", target: "S" },
  { id: 51, text: "J’ouvre rarement plus d’une position à la fois.", axis: "action", target: "S" },
  { id: 52, text: "J’ouvre souvent plusieurs positions en même temps.", axis: "action", target: "T" },
  { id: 53, text: "Je limite volontairement mes trades quotidiens.", axis: "action", target: "S" },
  { id: 54, text: "Je trade sans limite tant que le marché est actif.", axis: "action", target: "T" },
  { id: 55, text: "Je pense qu’un petit nombre de trades suffit.", axis: "action", target: "S" },
  { id: 56, text: "Je pense que plus j’enchaîne, mieux c’est.", axis: "action", target: "T" },
  { id: 57, text: "Je me sens en sécurité avec peu de clics.", axis: "action", target: "S" },
  { id: 58, text: "Je me sens excité avec beaucoup de clics.", axis: "action", target: "T" },
  { id: 59, text: "Je crois que la retenue est une qualité.", axis: "action", target: "S" },
  { id: 60, text: "Je crois que l’audace est une qualité.", axis: "action", target: "T" },
  // AXIS 3 — COGNITION (R vs X)
  { id: 61, text: "J’ai besoin de preuves chiffrées pour cliquer.", axis: "cognition", target: "R" },
  { id: 62, text: "Je clique souvent sur une impression forte.", axis: "cognition", target: "X" },
  { id: 63, text: "Je fais confiance aux statistiques.", axis: "cognition", target: "R" },
  { id: 64, text: "Je fais confiance à mon instinct.", axis: "cognition", target: "X" },
  { id: 65, text: "J’ai du mal à agir sans plan écrit.", axis: "cognition", target: "R" },
  { id: 66, text: "J’ai du mal à agir sans ressentir une conviction intérieure.", axis: "cognition", target: "X" },
  { id: 67, text: "Je me fie surtout aux indicateurs techniques.", axis: "cognition", target: "R" },
  { id: 68, text: "Je me fie surtout à l’ambiance du marché.", axis: "cognition", target: "X" },
  { id: 69, text: "Je préfère la logique froide.", axis: "cognition", target: "R" },
  { id: 70, text: "Je préfère l’intuition vive.", axis: "cognition", target: "X" },
  { id: 71, text: "Une perte n’affecte pas mon jugement.", axis: "cognition", target: "R" },
  { id: 72, text: "Une perte me bouleverse fortement.", axis: "cognition", target: "X" },
  { id: 73, text: "Je reste stable après un gain.", axis: "cognition", target: "R" },
  { id: 74, text: "Je suis exalté après un gain.", axis: "cognition", target: "X" },
  { id: 75, text: "J’arrive à rester neutre en toute circonstance.", axis: "cognition", target: "R" },
  { id: 76, text: "J’ai du mal à rester neutre face aux variations.", axis: "cognition", target: "X" },
  { id: 77, text: "Je crois que les émotions doivent être éteintes.", axis: "cognition", target: "R" },
  { id: 78, text: "Je crois que les émotions donnent de l’énergie.", axis: "cognition", target: "X" },
  { id: 79, text: "Je considère les pertes comme un coût normal.", axis: "cognition", target: "R" },
  { id: 80, text: "Je considère les pertes comme une blessure personnelle.", axis: "cognition", target: "X" },
  { id: 81, text: "J’aime analyser en détail les données chiffrées.", axis: "cognition", target: "R" },
  { id: 82, text: "J’aime me fier à mes ressentis face aux graphiques.", axis: "cognition", target: "X" },
  { id: 83, text: "Je prends du plaisir à construire des statistiques.", axis: "cognition", target: "R" },
  { id: 84, text: "Je prends du plaisir à lire le marché “à l’œil nu”.", axis: "cognition", target: "X" },
  { id: 85, text: "Je fais confiance aux modèles.", axis: "cognition", target: "R" },
  { id: 86, text: "Je fais confiance à mes sensations.", axis: "cognition", target: "X" },
  { id: 87, text: "Je préfère suranalyser plutôt que ressentir.", axis: "cognition", target: "R" },
  { id: 88, text: "Je préfère ressentir plutôt que suranalyser.", axis: "cognition", target: "X" },
  { id: 89, text: "Les chiffres m’apaisent.", axis: "cognition", target: "R" },
  { id: 90, text: "Les chiffres me fatiguent.", axis: "cognition", target: "X" },
  // AXIS 4 — CONTROL (D vs C)
  { id: 91, text: "Je respecte mon plan même quand c’est difficile.", axis: "control", target: "D" },
  { id: 92, text: "Je dévie souvent de mon plan.", axis: "control", target: "C" },
  { id: 93, text: "Je crois qu’une règle doit être respectée.", axis: "control", target: "D" },
  { id: 94, text: "Je crois qu’une règle peut être adaptée selon l’humeur.", axis: "control", target: "C" },
  { id: 95, text: "Je garde toujours mes stops fixes.", axis: "control", target: "D" },
  { id: 96, text: "Je déplace souvent mes stops.", axis: "control", target: "C" },
  { id: 97, text: "Je respecte mon risque par trade.", axis: "control", target: "D" },
  { id: 98, text: "Je dépasse souvent mon risque par trade.", axis: "control", target: "C" },
  { id: 99, text: "J’ai confiance dans mes règles.", axis: "control", target: "D" },
  { id: 100, text: "J’ai confiance dans mon instinct même contre les règles.", axis: "control", target: "C" },
  { id: 101, text: "Je tiens un journal de trading précis.", axis: "control", target: "D" },
  { id: 102, text: "Je ne tiens pas de journal.", axis: "control", target: "C" },
  { id: 103, text: "Je relis mes notes régulièrement.", axis: "control", target: "D" },
  { id: 104, text: "Je préfère improviser.", axis: "control", target: "C" },
  { id: 105, text: "J’aime planifier mes sessions.", axis: "control", target: "D" },
  { id: 106, text: "J’aime la spontanéité totale.", axis: "control", target: "C" },
  { id: 107, text: "Je relis mes erreurs passées.", axis: "control", target: "D" },
  { id: 108, text: "Je préfère oublier mes erreurs passées.", axis: "control", target: "C" },
  { id: 109, text: "Je suis organisé dans ma routine.", axis: "control", target: "D" },
  { id: 110, text: "Je suis désordonné dans ma routine.", axis: "control", target: "C" },
  { id: 111, text: "J’attends toujours la session prévue.", axis: "control", target: "D" },
  { id: 112, text: "Je peux cliquer à n’importe quel moment.", axis: "control", target: "C" },
  { id: 113, text: "Je crois que la discipline horaire est essentielle.", axis: "control", target: "D" },
  { id: 114, text: "Je crois que le timing n’a pas de règles.", axis: "control", target: "C" },
  { id: 115, text: "Je respecte mon calendrier.", axis: "control", target: "D" },
  { id: 116, text: "Je trade sans calendrier.", axis: "control", target: "C" },
  { id: 117, text: "J’ai besoin de structure.", axis: "control", target: "D" },
  { id: 118, text: "J’ai besoin de liberté.", axis: "control", target: "C" },
  { id: 119, text: "J’aime le trading ritualisé.", axis: "control", target: "D" },
  { id: 120, text: "J’aime le trading imprévisible.", axis: "control", target: "C" },
];

// ---- Utilities

const shuffle = <T,>(arr: T[], seed: number) => {
  // Mulberry32 PRNG for deterministic shuffles per session
  let t = seed >>> 0;
  const rand = () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// Map code ➜ label & family
const PROFILE_LABELS: Record<string, { title: string; family: string; tagline: string }>
  = {
    // Freezers (SI**)
    SIRD: { title: "Freezer — Méthodique (SIRD)", family: "Freezer", tagline: "Rigueur froide, exécution posée." },
    SITD: { title: "Freezer — Anxieux (SITD)", family: "Freezer", tagline: "Vigilance extrême, fébrilité intérieure." },
    SIRX: { title: "Freezer — Analyste (SIRX)", family: "Freezer", tagline: "Surintellectualisation, hésitation chronique." },
    SITX: { title: "Freezer — Chaotique (SITX)", family: "Freezer", tagline: "Agitation sans direction, confusion glacée." },
    // Écureuils (OI**)
    OIRD: { title: "Écureuil — Discipliné (OIRD)", family: "Écureuil", tagline: "Routine forte, prudence élevée." },
    OITD: { title: "Écureuil — Paniqué (OITD)", family: "Écureuil", tagline: "Urgence permanente, sur-réactions." },
    OIRX: { title: "Écureuil — Prudent (OIRX)", family: "Écureuil", tagline: "Sélectif, souvent spectateur." },
    OITX: { title: "Écureuil — Sauvage (OITX)", family: "Écureuil", tagline: "Action impulsive, besoin d’intensité." },
    // Snipers (SE**)
    SERD: { title: "Sniper — Strict (SERD)", family: "Sniper", tagline: "Zéro improvisation, métronome intérieur." },
    SETD: { title: "Sniper — Crispé (SETD)", family: "Sniper", tagline: "Hyper‑tension, précision anxieuse." },
    SERX: { title: "Sniper — Rêveur (SERX)", family: "Sniper", tagline: "Vision large, scénarios imaginés." },
    SETX: { title: "Sniper — Nerveux (SETX)", family: "Sniper", tagline: "Réactivité extrême, agitation continue." },
    // Kamikazes (OE**)
    OERD: { title: "Kamikaze — Structuré (OERD)", family: "Kamikaze", tagline: "Assauts planifiés, énergie canalisée." },
    OETD: { title: "Kamikaze — Nerveux (OETD)", family: "Kamikaze", tagline: "Explosif, précipitation chronique." },
    OERX: { title: "Kamikaze — Euphorique (OERX)", family: "Kamikaze", tagline: "Ivresse des gains, cycles extrêmes." },
    OETX: { title: "Kamikaze — Vengeur (OETX)", family: "Kamikaze", tagline: "Revanche, escalades risquées." },
  };

function pickProfile(code: string) {
  return PROFILE_LABELS[code] ?? { title: code, family: "", tagline: "" };
}

// Compute 4-letter code
function computeCode(scores: Record<Axis, Record<Letter, number>>): string {
  const I = scores.energy.I ?? 0; const E = scores.energy.E ?? 0;
  const S = scores.action.S ?? 0; const T = scores.action.T ?? 0;
  const R = scores.cognition.R ?? 0; const X = scores.cognition.X ?? 0;
  const D = scores.control.D ?? 0; const C = scores.control.C ?? 0;

  const l1 = S >= T ? "S" : "O"; // first letter is S (Sous) or O (Over/Sur)
  const l2 = I >= E ? "I" : "E"; // energy
  const l3 = R >= X ? "R" : "X"; // cognition
  const l4 = D >= C ? "D" : "C"; // control
  return `${l1}${l2}${l3}${l4}`;
}

// ---- Main App

const PAGESIZE = 12; // 10 pages × 12 = 120
const STORAGE_KEY = "ltti_r56_answers_v1";
const STORAGE_SEED = "ltti_r56_seed_v1";

export default function LTTIApp() {
  // Deterministic shuffle per session (persist seed)
  const [seed, setSeed] = useState<number>(() => {
    const s = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_SEED) : null;
    if (s) return Number(s);
    const newSeed = Date.now();
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_SEED, String(newSeed));
    return newSeed;
  });

  const questions = useMemo(() => shuffle(Q, seed), [seed]);
  const total = questions.length;
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // autosave
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers]);

  const pages = Math.ceil(total / PAGESIZE);
  const startIdx = page * PAGESIZE;
  const current = questions.slice(startIdx, startIdx + PAGESIZE);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / total) * 100);

  const allAnswered = answeredCount === total;

  function setAnswer(id: number, value: number) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  // scoring
  const scores = useMemo(() => {
    const res: Record<Axis, Record<Letter, number>> = {
      energy: { I: 0, E: 0 },
      action: { S: 0, T: 0 },
      cognition: { R: 0, X: 0 },
      control: { D: 0, C: 0 },
    };
    const opposite: Record<Letter, Letter> = {
      I: "E", E: "I",
      S: "T", T: "S",
      R: "X", X: "R",
      D: "C", C: "D",
    };
    for (const q of questions) {
      const v = answers[q.id];
      if (!v) continue; // unanswered
      // clamp 1..5
      const val = Math.min(5, Math.max(1, v));
      const axisMap = res[q.axis];
      const opp = opposite[q.target];
      axisMap[q.target] = (axisMap[q.target] ?? 0) + val;
      axisMap[opp] = (axisMap[opp] ?? 0) + 6 - val;
    }
    return res;
  }, [answers, questions]);

  const code = computeCode(scores);
  const profile = pickProfile(code);

  function resetAll() {
    setAnswers({});
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      // keep seed to keep same order, unless full reset:
    }
    setPage(0);
  }

  function reshuffle() {
    // new seed, new order
    const newSeed = Date.now();
    setSeed(newSeed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_SEED, String(newSeed));
    }
    resetAll();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="text-xl font-bold">LTTI — LeToast Type Indicator</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-600">Progression</span>
            <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm tabular-nums w-10 text-right">{progress}%</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Result Banner */}
        {answeredCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-slate-500 text-sm">Code provisoire</div>
              <div className="text-2xl font-extrabold tracking-wide">{code}</div>
              <div className="text-slate-600">{profile.title}</div>
              <div className="ml-auto flex gap-2">
                <button onClick={resetAll} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800">Réinitialiser</button>
                <button onClick={reshuffle} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800">Nouvel ordre</button>
                {allAnswered && (
                  <button onClick={() => window.print()} className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Imprimer / PDF</button>
                )}
              </div>
            </div>
            <div className="mt-2 text-slate-500 text-sm">Famille : <span className="font-medium">{profile.family}</span> • {profile.tagline}</div>
          </div>
        )}

        {/* Paged Questions */}
        {!allAnswered && (
          <div className="mb-4 text-sm text-slate-600">Page {page + 1} / {pages} — Répondez à toutes les questions (1 = pas du tout d’accord → 5 = tout à fait d’accord).</div>
        )}

        {!allAnswered ? (
          <div className="grid gap-4">
            {current.map((q) => (
              <QuestionCard key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
            ))}

            <div className="flex items-center justify-between mt-2">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50">← Précédent</button>
              <div className="text-slate-500 text-sm">Répondu : {answeredCount}/{total}</div>
              <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Suivant →</button>
            </div>
          </div>
        ) : (
          <ResultView code={code} scores={scores} />
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-10 text-center text-slate-400 text-sm print:hidden">
        © LTTI — Coach Toaster R5.6 • Test de personnalité de trading. • Utilisez Fichier → Imprimer pour exporter le résultat en PDF.
      </footer>

      {/* Print styles */}
      <style>{`
        @media print {
          header, footer, .print\:hidden { display: none !important; }
          main { padding: 0 !important; }
          .print\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function QuestionCard({ q, value, onChange }: { q: QuestionItem; value?: number; onChange: (v: number) => void }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-slate-400 font-mono pt-0.5 w-10">#{q.id}</div>
        <div className="flex-1">
          <div className="text-slate-900 mb-3">{q.text}</div>
          <Likert value={value} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

function Likert({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const opts = [1,2,3,4,5];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {opts.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={[
            "px-3 py-2 rounded-xl border",
            value === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-300 hover:bg-slate-50"
          ].join(" ")}
          aria-pressed={value === n}
        >{n}</button>
      ))}
      <span className="text-xs text-slate-500 ml-2">1 = Pas du tout d’accord • 5 = Tout à fait d’accord</span>
    </div>
  );
}

function ResultView({ code, scores }: { code: string; scores: Record<Axis, Record<Letter, number>> }) {
  const profile = pickProfile(code);

  const familyColor: Record<string, string> = {
    Freezer: "bg-blue-50 border-blue-200",
    Écureuil: "bg-green-50 border-green-200",
    Sniper: "bg-yellow-50 border-yellow-200",
    Kamikaze: "bg-red-50 border-red-200",
  };

  return (
    <div className="grid gap-6 print:block">
      <div className={`p-6 rounded-2xl border ${familyColor[profile.family] ?? "bg-slate-50 border-slate-200"}`}>
        <div className="text-sm text-slate-500">Votre profil LTTI</div>
        <div className="mt-1 text-4xl font-black tracking-wide">{code}</div>
        <div className="mt-1 text-lg text-slate-800 font-semibold">{profile.title}</div>
        <div className="mt-1 text-slate-600">Famille : {profile.family} — {profile.tagline}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <AxisCard title="Énergie (I/E)" aLabel="I" bLabel="E" a={scores.energy.I} b={scores.energy.E} />
        <AxisCard title="Action (S/T)" aLabel="S" bLabel="T" a={scores.action.S} b={scores.action.T} />
        <AxisCard title="Cognition (R/X)" aLabel="R" bLabel="X" a={scores.cognition.R} b={scores.cognition.X} />
        <AxisCard title="Contrôle (D/C)" aLabel="D" bLabel="C" a={scores.control.D} b={scores.control.C} />
      </div>

      <div className="print:hidden flex items-center gap-3">
        <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Exporter en PDF</button>
        <span className="text-slate-500 text-sm">Astuce : utilisez « Enregistrer au format PDF » dans la boîte d’impression.</span>
      </div>
    </div>
  );
}

function AxisCard({ title, aLabel, bLabel, a, b }: { title: string; aLabel: string; bLabel: string; a: number; b: number }) {
  const total = a + b;
  const aPct = total ? Math.round((a / total) * 100) : 0;
  const bPct = 100 - aPct;
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="text-slate-800 font-semibold mb-2">{title}</div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500" style={{ width: `${aPct}%` }} />
        </div>
        <div className="text-sm text-slate-600 tabular-nums w-16 text-right">{aPct}%</div>
      </div>
      <div className="text-slate-600 text-sm flex items-center justify-between">
        <span>{aLabel} : {a}</span>
        <span>{bLabel} : {b} ({bPct}%)</span>
      </div>
    </div>
  );
}
