export default function Features() {
  const items = [
    "AI Visa Assessment",
    "Country Suggestions",
    "Expert Consultation",
    "Smart AI Chatbot",
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
        Platform Features
      </h2>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition rounded-xl p-6 text-center text-lg font-medium text-gray-700"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
