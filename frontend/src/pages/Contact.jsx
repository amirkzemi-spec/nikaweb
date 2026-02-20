import { contactContent } from "../content/contactContent";

export default function Contact() {
  const t = contactContent;

  return (
    <div className="px-6 py-12 max-w-xl mx-auto">

      <h1 className="text-3xl font-bold mb-4 text-center">{t.title}</h1>
      <p className="text-gray-600 mb-10 text-center">{t.subtitle}</p>

      {/* FORM */}
      <form className="space-y-5 bg-white/70 p-6 rounded-xl shadow-sm border backdrop-blur">

        <div>
          <label className="block text-sm mb-1">{t.form.name}</label>
          <input
            type="text"
            className="w-full p-2 border rounded-lg text-sm"
            placeholder={t.form.name}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">{t.form.email}</label>
          <input
            type="email"
            className="w-full p-2 border rounded-lg text-sm"
            placeholder={t.form.email}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">{t.form.message}</label>
          <textarea
            rows="4"
            className="w-full p-2 border rounded-lg text-sm"
            placeholder={t.form.message}
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {t.form.button}
        </button>
      </form>

      {/* ALTERNATIVE CONTACTS */}
      <div className="mt-10 text-center space-y-2 text-gray-700">
        <p>{t.alt.telegram}: @nikavisa_admin</p>
        <p>{t.alt.phone}: +98 991 077 7743</p>
        <p className="text-sm text-gray-500">{t.alt.hours}</p>
      </div>
    </div>
  );
}
