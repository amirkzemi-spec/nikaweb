import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Static data ────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Brazil",
  "Bulgaria","Cambodia","Canada","Chile","China","Colombia","Croatia",
  "Czech Republic","Denmark","Ecuador","Egypt","Ethiopia","Finland","France",
  "Georgia","Germany","Ghana","Greece","Hungary","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Japan","Jordan","Kazakhstan","Kenya",
  "Kuwait","Kyrgyzstan","Lebanon","Libya","Malaysia","Mexico","Morocco","Nepal",
  "Netherlands","New Zealand","Nigeria","Norway","Pakistan","Palestine","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Saudi Arabia",
  "Senegal","Serbia","Singapore","Slovakia","South Africa","South Korea","Spain",
  "Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tajikistan",
  "Thailand","Tunisia","Turkey","Turkmenistan","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uzbekistan","Venezuela","Vietnam","Yemen","Zimbabwe",
];

const BUDGET_LABELS = ["< $15k", "$15k – $50k", "$50k – $150k", "$150k+"];
const BUDGET_SCORES = [5, 12, 20, 25];

const PATHWAY_MAP = {
  Study:     "Netherlands Student Visa",
  Startup:   "Netherlands Startup Visa",
  Work:      "Germany Job Seeker Visa",
  Residency: "Greece FIP Visa",
};

const DEEP_QUESTIONS = {
  Study: [
    { id: "gpa",            label: "GPA / Academic Grade",       options: ["< 2.5", "2.5 – 3.0", "3.0 – 3.5", "3.5+"] },
    { id: "degree_target",  label: "Target Degree",              options: ["Foundation", "Bachelor", "Master", "PhD"] },
    { id: "field",          label: "Field of Study",             options: ["Engineering", "Business", "Medicine", "IT / Tech", "Arts", "Other"] },
    { id: "scholarship",    label: "Scholarship Needed?",        options: ["Yes, essential", "Preferred but not required", "No"] },
    { id: "refusal",        label: "Previous Visa Refusal?",     options: ["No", "Yes – once", "Yes – multiple"] },
    { id: "financial_proof",label: "Financial Proof Available?", options: ["Yes, ready", "Partially", "Not yet"] },
  ],
  Startup: [
    { id: "stage",       label: "Business Stage",                options: ["Idea only", "MVP built", "Revenue-generating", "Scaling"] },
    { id: "industry",    label: "Industry",                      options: ["Tech / SaaS", "HealthTech", "FinTech", "E-commerce", "Other"] },
    { id: "team_size",   label: "Team Size",                     options: ["Solo founder", "2 – 5", "6 – 15", "15+"] },
    { id: "capital",     label: "Capital Available",             options: ["< €10k", "€10k – €50k", "€50k – €200k", "€200k+"] },
    { id: "incorporated",label: "Company Incorporated?",         options: ["Yes", "In progress", "No"] },
    { id: "why_country", label: "Primary Reason for Target Country", options: ["Market access", "Ecosystem / VCs", "Quality of life", "Visa pathway"] },
  ],
  Work: [
    { id: "occupation",     label: "Occupation",                options: ["IT / Tech", "Healthcare", "Engineering", "Finance", "Education", "Other"] },
    { id: "experience",     label: "Years of Experience",       options: ["< 2 years", "2 – 5 years", "5 – 10 years", "10+ years"] },
    { id: "job_offer",      label: "Job Offer Secured?",        options: ["Yes", "No – actively searching", "In talks"] },
    { id: "salary",         label: "Expected Annual Salary",    options: ["< €30k", "€30k – €60k", "€60k – €90k", "€90k+"] },
    { id: "blue_card",      label: "EU Blue Card Eligible?",    options: ["Yes", "Not sure", "No"] },
    { id: "certifications", label: "Professional Certifications?", options: ["Yes – internationally recognized", "Yes – local only", "None"] },
  ],
  Residency: [
    { id: "invest_amount", label: "Investment Amount",          options: ["< €100k", "€100k – €300k", "€300k – €1M", "€1M+"] },
    { id: "fund_source",   label: "Source of Funds",            options: ["Business income", "Savings", "Investment returns", "Inheritance"] },
    { id: "family_size",   label: "Family to Include",          options: ["Just me", "Me + spouse", "Me + spouse + children", "Extended family"] },
    { id: "prev_refusal",  label: "Previous Visa Refusals?",    options: ["None", "1 refusal", "Multiple"] },
    { id: "countries",     label: "Countries of Interest",      options: ["Greece", "Portugal", "Spain", "Malta", "Cyprus", "Other"] },
    { id: "urgency",       label: "Urgency",                    options: ["Within 3 months", "3 – 6 months", "6 – 12 months", "No rush"] },
  ],
};

// ── Scoring ────────────────────────────────────────────────────────────────

function calcScore(f) {
  const eduMap  = { "High School": 5, "Bachelor": 12, "Master": 17, "PhD": 20 };
  const engMap  = { "Basic": 5, "Intermediate": 12, "Advanced": 17, "IELTS 6.5+": 20 };
  const timMap  = { "ASAP": 15, "6–12 months": 12, "1–2 years": 8, "Flexible": 5 };
  return (
    (eduMap[f.education]  || 0) +
    (BUDGET_SCORES[f.budget] || 0) +
    (timMap[f.timeline]   || 0) +
    (engMap[f.english]    || 0) +
    (f.goal ? 20 : 0)
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;
  const label = step === 1 ? "Quick Profile" : step === 2 ? "Deep Dive" : "Almost Done";
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>Step {step} of 3 — {label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            value === o
              ? "bg-brand-600 text-white border-brand-600 shadow-soft"
              : "bg-white text-gray-700 border-gray-200 hover:border-brand-400"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function GoalCard({ icon, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all ${
        selected
          ? "border-brand-600 bg-brand-50 shadow-medium"
          : "border-gray-200 bg-white hover:border-brand-300 hover:shadow-soft"
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <span className={`text-sm font-semibold ${selected ? "text-brand-700" : "text-gray-700"}`}>
        {label}
      </span>
    </button>
  );
}

function CountryDropdown({ value, onChange }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);
  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative mt-2">
      <input
        type="text"
        value={query}
        placeholder="Search nationality..."
        onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange(""); }}
        onFocus={() => setOpen(true)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-medium max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <li
              key={c}
              onMouseDown={() => { onChange(c); setQuery(c); setOpen(false); }}
              className="px-4 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700 cursor-pointer"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BudgetSlider({ value, onChange }) {
  return (
    <div className="mt-3">
      <input
        type="range" min={0} max={3} step={1}
        value={value ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        {BUDGET_LABELS.map((l) => <span key={l}>{l}</span>)}
      </div>
      <p className="text-center text-sm font-semibold text-brand-600 mt-2">
        {BUDGET_LABELS[value ?? 1]}
      </p>
    </div>
  );
}

// ── Score reveal ───────────────────────────────────────────────────────────

function ScoreReveal({ score, goal, onContinue }) {
  const [displayed, setDisplayed] = useState(0);
  const pathway = PATHWAY_MAP[goal] || "a top visa pathway";

  useEffect(() => {
    let current = 0;
    const step = Math.ceil(score / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, score);
      setDisplayed(current);
      if (current >= score) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [score]);

  const color = score >= 70 ? "text-emerald-600" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const ring  = score >= 70 ? "border-emerald-400" : score >= 50 ? "border-yellow-400" : "border-red-400";

  return (
    <div className="text-center animate-fade-in py-6">
      <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest font-medium">
        Your Profile Score
      </p>

      <div className={`w-40 h-40 rounded-full border-8 ${ring} flex items-center justify-center mx-auto mb-6 transition-all duration-300`}>
        <span className={`text-5xl font-bold ${color}`}>{displayed}</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        You're <span className={color}>{score >= 70 ? "highly" : score >= 50 ? "moderately" : "partially"} aligned</span> with
      </h2>
      <p className="text-brand-600 font-semibold text-lg mb-8">{pathway}</p>

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-8 text-left max-w-sm mx-auto">
        <p className="text-sm text-gray-600 leading-relaxed">
          {score >= 70
            ? "Strong profile! Complete the next step to unlock your personalized roadmap and document checklist."
            : score >= 50
            ? "Good foundation. A few gaps to address — continue to see your full eligibility breakdown."
            : "There are some gaps to improve. Continue to see your options and what you can strengthen."}
        </p>
      </div>

      <button
        onClick={onContinue}
        className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-semibold text-lg hover:bg-brand-700 transition-colors shadow-medium"
      >
        See My Personalized Plan →
      </button>
    </div>
  );
}

// ── Thank you screen ───────────────────────────────────────────────────────

function ThankYou({ score, goal }) {
  const pathway = PATHWAY_MAP[goal] || "immigration pathway";
  return (
    <div className="text-center animate-fade-in py-6">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
      <p className="text-gray-600 mb-8">Our team will review your profile and reach out within 24 hours.</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-soft text-left mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700">
            {score}
          </div>
          <div>
            <p className="font-semibold text-gray-900">Eligibility Score</p>
            <p className="text-sm text-brand-600">{pathway}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Free consultation scheduled
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Document checklist will be emailed to you
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Personalized pathway report coming within 24h
          </div>
        </div>
      </div>

      <a
        href="/"
        className="inline-block px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
      >
        Back to Home
      </a>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Assessment() {
  const navigate = useNavigate();

  // Step: 1 | "score" | 2 | 3 | "done"
  const [view, setView] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [s1, setS1] = useState({
    goal: "", age: "", nationality: "", education: "",
    english: "", budget: 1, timeline: "",
  });
  const [s2, setS2] = useState({});
  const [s3, setS3] = useState({
    name: "", email: "", whatsapp: "", seriousness: 7, ready: "",
  });

  const score = calcScore({ ...s1, budget: s1.budget });

  const set1 = (k, v) => setS1((p) => ({ ...p, [k]: v }));
  const set2 = (k, v) => setS2((p) => ({ ...p, [k]: v }));
  const set3 = (k, v) => setS3((p) => ({ ...p, [k]: v }));

  const s1Complete = s1.goal && s1.age && s1.nationality && s1.education && s1.english && s1.timeline;
  const deepQs     = DEEP_QUESTIONS[s1.goal] || [];
  const s2Complete = deepQs.every((q) => s2[q.id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal:        s1.goal,
          age_range:   s1.age,
          nationality: s1.nationality,
          education:   s1.education,
          english:     s1.english,
          budget:      BUDGET_LABELS[s1.budget],
          timeline:    s1.timeline,
          deep_dive:   s2,
          contact:     s3,
        }),
      });
    } catch {
      // Show done screen regardless — lead is captured
    } finally {
      setSubmitting(false);
      setView("done");
    }
  };

  const stepNum = view === 1 ? 1 : view === "score" ? 1 : view === 2 ? 2 : 3;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            AI-Powered Assessment
          </span>
          <h1 className="text-3xl font-bold text-gray-900">
            Find Your Visa Pathway
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            3 steps · ~2 minutes · Free personalized report
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-medium border border-gray-100 p-8">

          {/* Progress bar (not on score/done screens) */}
          {typeof view === "number" && <ProgressBar step={stepNum} />}

          {/* ── STEP 1 ─────────────────────────────────────────── */}
          {view === 1 && (
            <div className="space-y-7 animate-fade-in">

              {/* Goal */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">What's your primary goal?</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[["🎓","Study"],["🚀","Startup"],["💼","Work"],["🏠","Residency"]].map(([icon, label]) => (
                    <GoalCard key={label} icon={icon} label={label}
                      selected={s1.goal === label}
                      onClick={() => set1("goal", label)}
                    />
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <p className="text-sm font-semibold text-gray-700">Your age range</p>
                <ChipGroup
                  options={["18 – 25", "26 – 35", "36 – 45", "45+"]}
                  value={s1.age}
                  onChange={(v) => set1("age", v)}
                />
              </div>

              {/* Nationality */}
              <div>
                <p className="text-sm font-semibold text-gray-700">Your nationality</p>
                <CountryDropdown value={s1.nationality} onChange={(v) => set1("nationality", v)} />
              </div>

              {/* Education */}
              <div>
                <p className="text-sm font-semibold text-gray-700">Highest education level</p>
                <ChipGroup
                  options={["High School", "Bachelor", "Master", "PhD"]}
                  value={s1.education}
                  onChange={(v) => set1("education", v)}
                />
              </div>

              {/* English */}
              <div>
                <p className="text-sm font-semibold text-gray-700">English proficiency</p>
                <ChipGroup
                  options={["Basic", "Intermediate", "Advanced", "IELTS 6.5+"]}
                  value={s1.english}
                  onChange={(v) => set1("english", v)}
                />
              </div>

              {/* Budget */}
              <div>
                <p className="text-sm font-semibold text-gray-700">Total budget for this move</p>
                <BudgetSlider value={s1.budget} onChange={(v) => set1("budget", v)} />
              </div>

              {/* Timeline */}
              <div>
                <p className="text-sm font-semibold text-gray-700">Preferred timeline</p>
                <ChipGroup
                  options={["ASAP", "6–12 months", "1–2 years", "Flexible"]}
                  value={s1.timeline}
                  onChange={(v) => set1("timeline", v)}
                />
              </div>

              <button
                onClick={() => setView("score")}
                disabled={!s1Complete}
                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-semibold text-base hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                See My Score →
              </button>
            </div>
          )}

          {/* ── SCORE REVEAL ───────────────────────────────────── */}
          {view === "score" && (
            <ScoreReveal score={score} goal={s1.goal} onContinue={() => setView(2)} />
          )}

          {/* ── STEP 2 ─────────────────────────────────────────── */}
          {view === 2 && (
            <div className="space-y-7 animate-fade-in">
              <div className="text-center mb-2">
                <span className="text-2xl">{s1.goal === "Study" ? "🎓" : s1.goal === "Startup" ? "🚀" : s1.goal === "Work" ? "💼" : "🏠"}</span>
                <h2 className="text-lg font-bold text-gray-900 mt-1">{s1.goal} Pathway — Deep Dive</h2>
                <p className="text-sm text-gray-500">A few more details to refine your match</p>
              </div>

              {deepQs.map((q) => (
                <div key={q.id}>
                  <p className="text-sm font-semibold text-gray-700">{q.label}</p>
                  <ChipGroup
                    options={q.options}
                    value={s2[q.id]}
                    onChange={(v) => set2(q.id, v)}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setView("score")}
                  className="w-1/3 py-3.5 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setView(3)}
                  disabled={!s2Complete}
                  className="flex-1 py-3.5 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Final Step →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ─────────────────────────────────────────── */}
          {view === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold text-gray-900">Almost there!</h2>
                <p className="text-sm text-gray-500">Where should we send your personalized report?</p>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={s3.name}
                  onChange={(e) => set3("name", e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={s3.email}
                  onChange={(e) => set3("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">WhatsApp Number</label>
                <input
                  type="tel"
                  value={s3.whatsapp}
                  onChange={(e) => set3("whatsapp", e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              {/* Seriousness slider */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  How serious are you about this move?
                  <span className="ml-2 text-brand-600 font-bold">{s3.seriousness}/10</span>
                </label>
                <input
                  type="range" min={1} max={10} step={1}
                  value={s3.seriousness}
                  onChange={(e) => set3("seriousness", Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Just exploring</span>
                  <span>100% committed</span>
                </div>
              </div>

              {/* Ready in 30 days */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Ready to start within 30 days?</p>
                <ChipGroup
                  options={["Yes, let's go!", "Not quite yet"]}
                  value={s3.ready}
                  onChange={(v) => set3("ready", v)}
                />
              </div>

              {/* Summary card */}
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
                <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-3">Your Summary</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {score}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{PATHWAY_MAP[s1.goal]}</p>
                    <p className="text-xs text-gray-500">{s1.goal} · {s1.nationality} · {BUDGET_LABELS[s1.budget]}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Upon submission, our team will prepare your personalized eligibility report and reach out within 24 hours.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setView(2)}
                  className="w-1/3 py-3.5 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!s3.name || !s3.email || !s3.ready || submitting}
                  className="flex-1 py-3.5 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Get My Free Report →"}
                </button>
              </div>
            </div>
          )}

          {/* ── DONE ───────────────────────────────────────────── */}
          {view === "done" && <ThankYou score={score} goal={s1.goal} />}

        </div>

        {/* Footer note */}
        {view !== "done" && (
          <p className="text-center text-xs text-gray-400 mt-6">
            🔒 Your data is private and never shared without consent
          </p>
        )}
      </div>
    </div>
  );
}
