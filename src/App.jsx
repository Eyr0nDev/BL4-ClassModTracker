// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ClassMods from "./pages/ClassMods";
import Boss from "./pages/Boss";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/classmods" element={<ClassMods />} />
        <Route path="/boss/:slug" element={<Boss />} />
      </Routes>
    </BrowserRouter>
  );
}
