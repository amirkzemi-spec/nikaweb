import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { runAssessment } from "../api/assessment";

export default function Assessment() {
  const navigate = useNavigate();

  // FORM STATE
  const [form, setForm] = useState({
    country: "",
    visa_type: "",
    ielts: "",
    education: "",
    budget: "",
    email: "",
    whatsapp: "",
  });

  // WIZARD STATE
  const [step, setStep] = useState(1);

  const t = {
    next: "Next",
    back: "Back",
    submit: "Submit Assessment",

    country: "Destination Country",
    visaType: "Visa Type",
    ielts: "IELTS Score",
    education: "Education",
    budget: "Budget (USD)",
    email: "Email Address",
    whatsapp: "WhatsApp Number",

    header: "AI-Powered Visa Assessment",
    desc: "Enter your details step-by-step to receive a personalized visa evaluation.",
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // SUBMIT FORM → CALL BACKEND
  const handleSubmit = async () => {
    const result = await runAssessment(form);

    navigate("/result", {
      state: { result },
    });
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-16 animate-fadeIn">
      <h1 className="text-3xl font-bold text-center text-brand-700 mb-4">
        {t.header}
      </h1>
      <p className="text-center text-gray-600 mb-10">{t.desc}</p>

      {/* STEP INDICATOR */}
      <div className="flex justify-between mb-10">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`w-10 h-10 flex items-center justify-center rounded-full border
              ${
                step === n
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-300 text-gray-500"
              }
            `}
          >
            {n}
          </div>
        ))}
      </div>

      {/* --- STEP 1 --- */}
      {step === 1 && (
        <div className="space-y-5 animate-scaleIn">
          <label className="block">
            <span className="text-gray-700">{t.country}</span>
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg px-4 py-3"
              placeholder={t.country}
            />
          </label>

          <button
            onClick={handleNext}
            className="w-full bg-brand-600 text-white py-3 rounded-lg text-lg hover:bg-brand-700"
          >
            {t.next}
          </button>
        </div>
      )}

      {/* --- STEP 2 --- */}
      {step === 2 && (
        <div className="space-y-5 animate-scaleIn">
          <label className="block">
            <span className="text-gray-700">{t.visaType}</span>
            <input
              name="visa_type"
              value={form.visa_type}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg px-4 py-3"
              placeholder={t.visaType}
            />
          </label>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="w-1/2 border border-gray-400 py-3 rounded-lg"
            >
              {t.back}
            </button>

            <button
              onClick={handleNext}
              className="w-1/2 bg-brand-600 text-white py-3 rounded-lg"
            >
              {t.next}
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3 --- */}
      {step === 3 && (
        <div className="space-y-5 animate-scaleIn">
          <label className="block">
            <span className="text-gray-700">{t.ielts}</span>
            <input
              name="ielts"
              value={form.ielts}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg px-4 py-3"
              placeholder={t.ielts}
            />
          </label>

          <label className="block">
            <span className="text-gray-700">{t.education}</span>
            <input
              name="education"
              value={form.education}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg px-4 py-3"
              placeholder={t.education}
            />
          </label>

          <label className="block">
            <span className="text-gray-700">{t.budget}</span>
            <input
              name="budget"
              value={form.budget}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg px-4 py-3"
              placeholder={t.budget}
            />
          </label>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="w-1/2 border border-gray-400 py-3 rounded-lg"
            >
              {t.back}
            </button>

            <button
              onClick={handleNext}
              className="w-1/2 bg-brand-600 text-white py-3 rounded-lg"
            >
              {t.next}
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 4 (CONTACT + SUBMIT) --- */}
      {step === 4 && (
        <div className="space-y-5 animate-scaleIn">
          <label className="block">
            <span className="text-gray-700">{t.email}</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg px-4 py-3"
              placeholder={t.email}
            />
          </label>

          <label className="block">
            <span className="text-gray-700">{t.whatsapp}</span>
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg px-4 py-3"
              placeholder={t.whatsapp}
            />
          </label>

          <div className="bg-white shadow-soft rounded-xl p-5 border">
            <h2 className="text-xl font-bold mb-3">
              Confirm Information
            </h2>

            <ul className="text-gray-700 space-y-1">
              <li>• {t.country}: {form.country}</li>
              <li>• {t.visaType}: {form.visa_type}</li>
              <li>• {t.ielts}: {form.ielts}</li>
              <li>• {t.education}: {form.education}</li>
              <li>• {t.budget}: {form.budget}</li>
              <li>• {t.email}: {form.email}</li>
              <li>• {t.whatsapp}: {form.whatsapp}</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="w-1/2 border border-gray-400 py-3 rounded-lg"
            >
              {t.back}
            </button>

            <button
              onClick={handleSubmit}
              className="w-1/2 bg-brand-600 text-white py-3 rounded-lg text-lg hover:bg-brand-700"
            >
              {t.submit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
