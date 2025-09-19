// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ClassMods from "./pages/ClassMods";

// simple placeholders for boss pages (you can replace later)
function Splaszone() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2">Splaszone — Dedicated Loot</h1>
        <p className="text-slate-400">Lead Balloon • Fireworks • Jelly</p>
        <p className="mt-6 text-slate-300">Tracker coming soon.</p>
      </div>
    </main>
  );
}
function Voraxis() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2">Voraxis — Dedicated Loot</h1>
        <p className="text-slate-400">Darkbeast • Potato Thrower IV • Buoy</p>
        <p className="mt-6 text-slate-300">Tracker coming soon.</p>
      </div>
    </main>
  );
}
function Oppressor() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2">The Oppressor — Dedicated Loot</h1>
        <p className="text-slate-400">Streamer • Asher’s Rise • Blood Analyser</p>
        <p className="mt-6 text-slate-300">Tracker coming soon.</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/classmods" element={<ClassMods />} />
        <Route path="/boss/splaszone" element={<Splaszone />} />
        <Route path="/boss/voraxis" element={<Voraxis />} />
        <Route path="/boss/oppressor" element={<Oppressor />} />
      </Routes>
    </BrowserRouter>
  );
}
