import { Link } from "react-router-dom";

export default function FloatingConsultButton() {
  return (
    <Link
      to="/assessment"
      className="
        fixed bottom-6 right-6 z-50
        bg-brand-600 hover:bg-brand-700
        text-white px-6 py-4 rounded-full
        shadow-strong text-lg font-semibold
        animate-scaleIn
      "
    >
      Start Consultation
    </Link>
  );
}
