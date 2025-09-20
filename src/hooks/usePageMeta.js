import { useEffect } from "react";

export default function usePageMeta({
  title,
  description,
  canonicalPath,
}) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    // description
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement("meta");
      descEl.setAttribute("name", "description");
      document.head.appendChild(descEl);
    }
    const prevDesc = descEl.getAttribute("content");
    if (description) descEl.setAttribute("content", description);

    // canonical
    let canEl = document.querySelector('link[rel="canonical"]');
    if (!canEl) {
      canEl = document.createElement("link");
      canEl.setAttribute("rel", "canonical");
      document.head.appendChild(canEl);
    }
    const prevCan = canEl.getAttribute("href");
    if (canonicalPath) {
      const origin = window.location.origin || "https://vaultdrops.app";
      const href = canonicalPath.startsWith("http")
        ? canonicalPath
        : origin.replace(/\/+$/, "") + canonicalPath;
      canEl.setAttribute("href", href);
    }

    return () => {
      // restore title
      if (prevTitle) document.title = prevTitle;
      // restore description
      if (prevDesc) descEl.setAttribute("content", prevDesc);
      // restore canonical
      if (prevCan) canEl.setAttribute("href", prevCan);
    };
  }, [title, description, canonicalPath]);
}
