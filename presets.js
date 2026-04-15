/* ─────────────────────────────────────────────────────────────
   Bingqilin — Player Presets
   Edit this file to add, remove, or reorder sources.

   Each preset:
     name        display label in Settings
     movie_url   template for movies  — {tmdb} is replaced
     tv_url      template for TV      — {tmdb}, {season}, {episode} replaced
     sandbox     (optional) custom sandbox attribute string for this preset's
                 iframe. Omit or set to null to use the global sandbox toggle.
                 Set to "" (empty string) to disable sandboxing for this preset.
   ───────────────────────────────────────────────────────────── */
window.API_PRESETS = [
  {
    name:      "vidsrc.cc",
    movie_url: "https://vidsrc.cc/v2/embed/movie/{tmdb}",
    tv_url:    "https://vidsrc.cc/v2/embed/tv/{tmdb}/{season}/{episode}",
    sandbox:   "allow-scripts allow-same-origin"
  },
  {
    name:      "vidsrc-embed.ru",
    movie_url: "https://vidsrc-embed.ru/embed/movie?tmdb={tmdb}",
    tv_url:    "https://vidsrc-embed.ru/embed/tv?tmdb={tmdb}&season={season}&episode={episode}",
    sandbox:   ""
  }
];

/* Index of the preset selected by default (0 = first) */
window.DEFAULT_PRESET_INDEX = 0;
