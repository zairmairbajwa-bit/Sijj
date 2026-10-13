/**
 * src/App.jsx
 *
 * Lightweight, production-minded single-file React app that provides a
 * mock TMDB-powered "sijjmovieshub" UI with:
 * - Tab navigation (Movies / Web Series)
 * - Web Series seasons selector that dynamically updates episodes list
 * - Global Hindi-dubbed / Bollywood prioritization & top highlights bar
 * - In-app raw HTML5 player (no popups / window.open)
 * - Local download simulation hooks (web-friendly, lightweight)
 *
 * Notes:
 * - No native/exotic dependencies are required. This works in plain React apps.
 * - If you supply a real TMDB key as REACT_APP_TMDB_API_KEY, the app will attempt
 *   to fetch live data; otherwise the built-in mock catalog will be used.
 * - Keep real secrets out of source. This file reads env vars but never prints them.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

/* -----------------------
   Configuration Helpers
   ----------------------- */
const getEnv = (k, fallback = "") =>
  (typeof process !== "undefined" && process.env && process.env[k]) || fallback;

const TMDB_API_KEY = getEnv("REACT_APP_TMDB_API_KEY", "");
const TMDB_BASE = "https://api.themoviedb.org/3";

/* -----------------------
   Tiny helper utilities
   ----------------------- */
const isHindiOrBollywood = (item = {}) => {
  const title = (item.title || item.name || "").toLowerCase();
  const overview = (item.overview || "").toLowerCase();
  const language = (item.original_language || "").toLowerCase();

  if (language === "hi") return true;
  if (title.includes("hindi") || overview.includes("hindi")) return true;
  if (title.includes("dub") || overview.includes("dubbed")) return true;
  if (title.includes("bollywood") || overview.includes("bollywood")) return true;
  return false;
};

const prioritizeHindiBollywood = (items = []) => {
  const scored = items.map((it) => {
    let s = (it.popularity || 0) / 100;
    if (isHindiOrBollywood(it)) s += 100;
    if ((it.title || it.name || "").toLowerCase().includes("bollywood")) s += 50;
    return { it, s };
  });
  return scored.sort((a, b) => b.s - a.s).map((r) => r.it);
};

/* -----------------------
   Mock Catalog (fallback)
   ----------------------- */
const MOCK_CATALOG = {
  movies: [
    {
      id: 1,
      title: "The Great Heist (Hindi Dubbed)",
      overview: "A tense thriller re-dubbed in Hindi for Indian audiences.",
      poster_path: null,
      popularity: 75,
      original_language: "en",
      external_stream:
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    },
    {
      id: 2,
      title: "Bollywood Dreams",
      overview: "A musical drama from Mumbai: epic songs and dance.",
      poster_path: null,
      popularity: 92,
      original_language: "hi",
      external_stream:
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    },
    {
      id: 3,
      title: "Indie Sci-Fi",
      overview: "English language indie sci-fi, not dubbed.",
      popularity: 34,
      original_language: "en",
    },
  ],
  series: [
    {
      id: 101,
      name: "Mumbai Detectives",
      overview: "Crime drama adapted for India — some episodes dubbed in Hindi.",
      poster_path: null,
      original_language: "en",
      seasons: [
        {
          season_number: 1,
          name: "Season 1",
          episodes: [
            {
              id: 10101,
              episode_number: 1,
              name: "Pilot",
              overview: "Series premiere.",
              external_stream:
                "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
            },
            {
              id: 10102,
              episode_number: 2,
              name: "The Second Case (Hindi Dubbed)",
              overview: "A case dubbed into Hindi.",
              external_stream:
                "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
            },
          ],
        },
        {
          season_number: 2,
          name: "Season 2",
          episodes: [
            {
              id: 10121,
              episode_number: 1,
              name: "New Beginnings",
              overview: "A new season starts.",
            },
            {
              id: 10122,
              episode_number: 2,
              name: "Mumbai Nights (Bollywood Remix)",
              overview: "Cultural episode with Bollywood references.",
            },
          ],
        },
      ],
    },
    {
      id: 102,
      name: "Desi Laughs",
      overview: "Comedy short episodes.",
      original_language: "hi",
      seasons: [
        {
          season_number: 1,
          name: "Season 1",
          episodes: [
            {
              id: 10201,
              episode_number: 1,
              name: "Funny Start (Hindi)",
              overview: "Episode in Hindi.",
            },
            {
              id: 10202,
              episode_number: 2,
              name: "Laugh Riot",
              overview: "Comedy continues.",
            },
          ],
        },
      ],
    },
  ],
};

/* -----------------------
   Lightweight TMDB fetch (optional)
   ----------------------- */
async function fetchFromTmdb(path, params = {}) {
  if (!TMDB_API_KEY) throw new Error("TMDB API key not provided");
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  Object.keys(params || {}).forEach((k) => url.searchParams.set(k, params[k]));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);
  return res.json();
}

/* -----------------------
   Download simulation helpers
   ----------------------- */

/**
 * Simulate a chunked background download. On web we cannot reliably write into
 * app-private folders, so we:
 * - stream (fetch) the resource when possible and create a blob for actual download
 * - while "downloading" we update a progress callback to simulate background chunking
 * - we store a small metadata record in localStorage (download library)
 *
 * This is intentionally lightweight: it will NOT attempt to write binary files to an
 * app-private native folder (no native deps). It simulates chunking and provides a browser
 * download when complete.
 */
const DOWNLOADS_KEY = "sijj_downloads_v1";

const readDownloadsMeta = () => {
  try {
    const raw = localStorage.getItem(DOWNLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const writeDownloadsMeta = (list) => {
  try {
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
  } catch {}
};

async function simulateChunkedDownload({ url, id, title, onProgress }) {
  const meta = readDownloadsMeta();
  const rec = { id, title, status: "running", progress: 0, createdAt: Date.now(), url };
  writeDownloadsMeta([rec, ...meta]);

  let blob = null;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Network error");
    blob = await resp.blob();
    const total = blob.size || 1;
    const chunks = 8;
    for (let i = 1; i <= chunks; i++) {
      await new Promise((r) => setTimeout(r, 180 * Math.random() + 120));
      const p = Math.min(100, Math.round((i / chunks) * 100));
      onProgress && onProgress(p);
      const current = readDownloadsMeta().filter(Boolean);
      const updated = current.map((m) => (m.id === id ? { ...m, progress: p } : m));
      writeDownloadsMeta(updated);
    }
  } catch (err) {
    for (let i = 1; i <= 10; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const p = Math.min(100, i * 10);
      onProgress && onProgress(p);
      const current = readDownloadsMeta().filter(Boolean);
      const updated = current.map((m) => (m.id === id ? { ...m, progress: p } : m));
      writeDownloadsMeta(updated);
    }
    blob = new Blob([`sijjmovieshub simulated content for ${title}`], { type: "text/plain" });
  }

  const finalMeta = readDownloadsMeta().map((m) =>
    m.id === id ? { ...m, status: "completed", progress: 100, finishedAt: Date.now() } : m
  );
  writeDownloadsMeta(finalMeta);

  return blob;
}

function triggerBrowserSave(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download.bin";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/* -----------------------
   Main App
   ----------------------- */
export default function App() {
  const [tab, setTab] = useState("movies"); // 'movies' | 'series'
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [movieQuery, setMovieQuery] = useState("");
  const [seriesQuery, setSeriesQuery] = useState("");
  const [topHighlights, setTopHighlights] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [playerSrc, setPlayerSrc] = useState("");
  const videoRef = useRef(null);

  const [downloadProgressMap, setDownloadProgressMap] = useState({});
  const [downloadsLibrary, setDownloadsLibrary] = useState(() => readDownloadsMeta());

  useEffect(() => {
    (async () => {
      if (TMDB_API_KEY) {
        try {
          const mvResp = await fetchFromTmdb("/movie/popular", { page: 1 });
          const tvResp = await fetchFromTmdb("/tv/popular", { page: 1 });
          const mv = (mvResp.results || []).map((m) => ({ ...m, type: "movie" }));
          const tv = (tvResp.results || []).map((t) => ({ ...t, type: "tv" }));
          setMovies(mv);
          setSeries(tv);
          const combined = [...mv, ...tv];
          setTopHighlights(prioritizeHindiBollywood(combined).slice(0, 8));
        } catch (err) {
          console.warn("TMDB fetch failed, falling back to local mock catalog.");
          setMovies(MOCK_CATALOG.movies);
          setSeries(MOCK_CATALOG.series);
          setTopHighlights(prioritizeHindiBollywood([...MOCK_CATALOG.movies, ...MOCK_CATALOG.series]).slice(0, 8));
        }
      } else {
        setMovies(MOCK_CATALOG.movies);
        setSeries(MOCK_CATALOG.series);
        setTopHighlights(prioritizeHindiBollywood([...MOCK_CATALOG.movies, ...MOCK_CATALOG.series]).slice(0, 8));
      }
    })();
  }, []);

  useEffect(() => {
    const onStorage = () => setDownloadsLibrary(readDownloadsMeta());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filteredMovies = useMemo(() => {
    const q = movieQuery.trim().toLowerCase();
    const base = movies || [];
    const filtered = q ? base.filter((m) => (m.title || "").toLowerCase().includes(q)) : base;
    return prioritizeHindiBollywood(filtered);
  }, [movies, movieQuery]);

  const filteredSeries = useMemo(() => {
    const q = seriesQuery.trim().toLowerCase();
    const base = series || [];
    const filtered = q ? base.filter((s) => (s.name || "").toLowerCase().includes(q)) : base;
    return filtered;
  }, [series, seriesQuery]);

  useEffect(() => {
    if (!selectedSeries) {
      setSelectedSeasonNumber(null);
      setEpisodes([]);
      return;
    }
    const s = selectedSeries.seasons && selectedSeries.seasons.length > 0 ? selectedSeries.seasons[0] : null;
    setSelectedSeasonNumber(s ? s.season_number : null);
    setEpisodes(s ? s.episodes || [] : []);
  }, [selectedSeries]);

  useEffect(() => {
    if (!selectedSeries || selectedSeasonNumber == null) return;
    const s = (selectedSeries.seasons || []).find((se) => se.season_number === Number(selectedSeasonNumber));
    setEpisodes(s ? s.episodes || [] : []);
  }, [selectedSeasonNumber, selectedSeries]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (!playerSrc) {
      vid.pause();
      vid.removeAttribute("src");
      return;
    }
    vid.src = playerSrc;
    vid.play().catch(() => {});
  }, [playerSrc]);

  const playItem = (item) => {
    const src = item.external_stream || item.stream || item.preview || "";
    if (!src) {
      alert("No direct stream URL available for this item in this demo.\nIn production, provide an `external_stream` URL on the item.");
      return;
    }
    setPlayerSrc(src);
    setTimeout(() => {
      videoRef.current && videoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  const startDownload = async ({ url, filename, id, title }) => {
    if (!url) {
      alert("No downloadable stream URL available for this item in this demo.");
      return;
    }
    setDownloadProgressMap((p) => ({ ...p, [id]: 0 }));
    const blob = await simulateChunkedDownload({
      url,
      id,
      title,
      onProgress: (p) => setDownloadProgressMap((prev) => ({ ...prev, [id]: p })),
    });
    if (blob) {
      triggerBrowserSave(blob, filename || `${title || "sijj"}_download.bin`);
    }
    setDownloadsLibrary(readDownloadsMeta());
    setTimeout(() => setDownloadProgressMap((p) => ({ ...p, [id]: 100 })), 200);
  };

  const clearDownloads = () => {
    if (!confirm("Clear simulated downloads metadata? This does not remove files from your downloads folder.")) return;
    writeDownloadsMeta([]);
    setDownloadsLibrary([]);
  };

  const Card = ({ title, subtitle, thumbnail, children, onClick }) => (
    <div
      onClick={onClick}
      style={{
        width: 180,
        margin: 8,
        padding: 8,
        background: "#111",
        borderRadius: 8,
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ height: 260, background: "#222", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
        {thumbnail ? <img src={thumbnail} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 6 }} /> : <div style={{ color: "#666" }}>No poster</div>}
      </div>
      <div style={{ marginTop: 8, fontWeight: 700 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#aaa" }}>{subtitle}</div>}
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050507", color: "#fff", fontFamily: "Inter, system-ui, Arial", padding: 20 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>sijjmovieshub</h1>
        <nav style={{ marginLeft: 12 }}>
          <button onClick={() => setTab("movies")} style={{ marginRight: 8, padding: "6px 10px", fontWeight: tab === "movies" ? 700 : 500 }}>
            Movies
          </button>
          <button onClick={() => setTab("series")} style={{ padding: "6px 10px", fontWeight: tab === "series" ? 700 : 500 }}>
            Web Series
          </button>
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <small style={{ color: "#9aa" }}>AdMob configured: {getEnv("REACT_APP_ADMOB_ID") ? "yes (hidden)" : "no"}</small>
        </div>
      </header>

      {/* Top highlights: prioritized Hindi / Bollywood */}
      <section style={{ marginTop: 18 }}>
        <h3 style={{ margin: "6px 0" }}>Trending — Hindi / Bollywood Highlights</h3>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {topHighlights.length === 0 ? (
            <div style={{ color: "#777" }}>No highlights</div>
          ) : (
            topHighlights.map((t) => (
              <div key={t.id} style={{ minWidth: 200 }}>
                <Card title={t.title || t.name} subtitle={t.overview} thumbnail={t.poster_path ? `https://image.tmdb.org/t/p/w300${t.poster_path}` : null}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => playItem(t)}>Play</button>
                    <button onClick={() => startDownload({ url: t.external_stream, filename: `${(t.title || t.name).replace(/\s+/g, "_")}.mp4`, id: `top-${t.id}`, title: t.title || t.name })}>
                      Download
                    </button>
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Player */}
      <section style={{ marginTop: 18 }}>
        <div style={{ background: "#000", padding: 8, borderRadius: 8 }}>
          <video ref={videoRef} controls style={{ width: "100%", maxHeight: 480, background: "#000" }} />
        </div>
      </section>

      {/* Main content area */}
      <main style={{ marginTop: 18 }}>
        {tab === "movies" ? (
          <section>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                placeholder="Search movies..."
                value={movieQuery}
                onChange={(e) => setMovieQuery(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: "1px solid #222", background: "#0b0b0b", color: "#fff" }}
              />
              <small style={{ color: "#9aa" }}>Hindi-dubbed & Bollywood titles are prioritized automatically.</small>
              <div style={{ marginLeft: "auto" }}>
                <button onClick={() => { setMovies(MOCK_CATALOG.movies); setSeries(MOCK_CATALOG.series); alert("Reset to mock catalog"); }}>
                  Reset (mock)
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap" }}>
              {filteredMovies.length === 0 ? <div style={{ color: "#777" }}>No movies found</div> : filteredMovies.map((m) => (
                <Card key={m.id} title={m.title} subtitle={m.overview} thumbnail={m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : null}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => playItem(m)}>Play</button>
                    <button onClick={() => startDownload({ url: m.external_stream, filename: `${(m.title || "movie").replace(/\s+/g, "_")}.mp4`, id: `mv-${m.id}`, title: m.title })}>
                      Download
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                placeholder="Search web series..."
                value={seriesQuery}
                onChange={(e) => setSeriesQuery(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: "1px solid #222", background: "#0b0b0b", color: "#fff" }}
              />
              <small style={{ color: "#9aa" }}>Select a series to view Seasons & Episodes</small>
            </div>

            <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
              <aside style={{ width: 360 }}>
                <h4 style={{ marginTop: 0 }}>Series</h4>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {filteredSeries.length === 0 ? <div style={{ color: "#777" }}>No series</div> : filteredSeries.map((s) => (
                    <div key={s.id} onClick={() => setSelectedSeries(s)} style={{ cursor: "pointer", width: 160 }}>
                      <Card title={s.name} subtitle={s.overview} thumbnail={s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : null}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedSeries(s); }}>Open</button>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </aside>

              <div style={{ flex: 1 }}>
                <h4 style={{ marginTop: 0 }}>{selectedSeries ? selectedSeries.name : "Select a series"}</h4>
                {selectedSeries && (
                  <>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                      <label style={{ color: "#9aa" }}>Season:</label>
                      <select
                        value={selectedSeasonNumber || ""}
                        onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                        style={{ padding: 8, borderRadius: 6, background: "#0b0b0b", color: "#fff", border: "1px solid #222" }}
                      >
                        {selectedSeries.seasons.map((s) => (
                          <option key={s.season_number} value={s.season_number}>
                            {s.name || `Season ${s.season_number}`}
                          </option>
                        ))}
                      </select>

                      <div style={{ marginLeft: "auto", color: "#9aa" }}>Episodes: {episodes.length}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                      {episodes.map((ep) => (
                        <div key={ep.id || `${selectedSeries.id}-${ep.episode_number}`} style={{ background: "#0b0b0b", padding: 12, borderRadius: 8 }}>
                          <div style={{ fontWeight: 700 }}>{ep.name}</div>
                          <div style={{ color: "#99a", fontSize: 13 }}>Episode {ep.episode_number}</div>
                          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                            <button onClick={() => playItem(ep)}>Play</button>
                            <button onClick={() => startDownload({ url: ep.external_stream, filename: `${(selectedSeries.name || "series").replace(/\s+/g, "_")}_S${selectedSeasonNumber}_E${ep.episode_number}.mp4`, id: `ep-${ep.id || `${selectedSeries.id}-${ep.episode_number}`}`, title: ep.name })}>
                              Download
                            </button>
                            <div style={{ marginLeft: "auto", fontSize: 12, color: "#7a7a7a" }}>
                              {isHindiOrBollywood(ep) ? "Hindi/Bollywood" : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer style={{ marginTop: 26, color: "#9aa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <strong>Downloads (simulated)</strong>
            <div style={{ fontSize: 13, color: "#7b7b7b" }}>Stored metadata only — files are saved via browser download.</div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => { setDownloadsLibrary(readDownloadsMeta()); }}>Refresh</button>
            <button onClick={clearDownloads}>Clear</button>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {downloadsLibrary.length === 0 && <div style={{ color: "#777" }}>No downloads yet</div>}
          {downloadsLibrary.map((d) => (
            <div key={d.id} style={{ background: "#0b0b0b", padding: 8, borderRadius: 6, minWidth: 220 }}>
              <div style={{ fontWeight: 700 }}>{d.title}</div>
              <div style={{ fontSize: 12, color: "#9aa" }}>Status: {d.status} • {d.progress || 0}%</div>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => { alert("This demo stores only metadata. Use browser downloads for real file."); }}>Open</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "#7b7b7b" }}>
          <div>Runtime mode: {process.env.NODE_ENV || "production"}</div>
          <div>TMDB key present: {TMDB_API_KEY ? "yes (hidden)" : "no — using mock catalog"}</div>
        </div>
      </footer>
    </div>
  );
}
