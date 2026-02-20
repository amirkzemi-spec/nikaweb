export default function AssistantSection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-r from-blue-50 to-blue-100 text-center">
      <h2 className="text-3xl font-extrabold text-gray-900">
        Nika AI Assistant
      </h2>

      <p className="text-lg text-gray-700 mt-4 max-w-2xl mx-auto">
        Ask any visa question. Fast, accurate, personalized.
      </p>

      <button className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-lg text-lg shadow-md hover:bg-blue-700 transition">
        Start Chat
      </button>
    </section>
  );
}
