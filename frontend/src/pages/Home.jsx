import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Hero from "../components/Hero";
import Features from "../components/Features";
import PathSection from "../components/PathSection";
import AssistantSection from "../components/AssistantSection";
import Footer from "../components/Footer";
import { searchPrograms } from "../api/search";

export default function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const data = await searchPrograms(query);

    navigate("/search-results", {
      state: { query, results: data.results },
    });
  };

  return (
    <>
      {/* Hero Section + Search */}
      <div className="relative">
        <Hero
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
        />
      </div>

      {/* Sections */}
      <Features />
      <PathSection />
      <AssistantSection />
      <Footer />
    </>
  );
}
