import { useLocation } from "react-router-dom";

export default function Result() {
  const { state } = useLocation();
  const result = state?.result;

  if (!result) {
    return (
      <div className="p-10 text-center text-gray-600">
        No result found. Please redo your assessment.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 animate-fadeIn">
      
      {/* SCORE CARD */}
      <div className="bg-white shadow-medium rounded-2xl p-8 mb-10 border border-gray-200">
        <h1 className="text-3xl font-bold text-brand-700 mb-4">
          Your Assessment Result
        </h1>
        
        <div className="flex items-center gap-6 mt-6">
          <div className="text-center">
            <div className="w-28 h-28 rounded-full bg-brand-100 flex items-center justify-center text-4xl font-bold text-brand-700 shadow-inner">
              {result.score}%
            </div>
            <p className="mt-2 text-gray-600">
              Eligibility Score
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">{result.visa}</h2>
            <p className="text-gray-700 mt-2 leading-relaxed">
              {result.summary}
            </p>
          </div>
        </div>
      </div>

      {/* MISSING DOCUMENTS */}
      <div className="bg-white shadow-soft rounded-xl p-6 mb-8 border border-gray-200">
        <h3 className="text-xl font-bold mb-3">Required Documents</h3>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          {result.missing_docs?.map((doc, i) => (
            <li key={i}>{doc}</li>
          ))}
        </ul>
      </div>

      {/* RISKS */}
      <div className="bg-white shadow-soft rounded-xl p-6 mb-8 border border-gray-200">
        <h3 className="text-xl font-bold mb-3">Risks</h3>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          {result.risks?.map((risk, i) => (
            <li key={i}>{risk}</li>
          ))}
        </ul>
      </div>

      {/* STEPS */}
      <div className="bg-white shadow-soft rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold mb-3">Next Steps</h3>
        <ol className="list-decimal pl-5 text-gray-700 space-y-1">
          {result.steps?.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
