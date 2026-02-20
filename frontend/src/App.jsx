import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import FloatingConsultButton from "./components/FloatingConsultButton";

import Home from "./pages/Home";
import Countries from "./pages/Countries";
import Visas from "./pages/Visas";
import Contact from "./pages/Contact";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";
import SearchResults from "./pages/SearchResults";
import VisaDetail from "./pages/VisaDetail";
import Chat from "./pages/Chat";

// Final blog system
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";

export default function App() {
  return (
    <Router>
      <Navbar />

      <main className="animate-fadeIn">
        <Routes>

          {/* BLOG SYSTEM — MUST COME FIRST */}
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* MAIN SITE */}
          <Route path="/" element={<Home />} />
          <Route path="/countries" element={<Countries />} />
          <Route path="/visas" element={<Visas />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/visa/:id" element={<VisaDetail />} />

          <Route
            path="/result"
            element={
              <Result result={{ score: 80, visa: "Test Visa" }} />
            }
          />

        </Routes>
      </main>

      <FloatingConsultButton />
    </Router>
  );
}
