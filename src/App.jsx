import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

// Optional: HLS support for browsers that don't natively support HLS
let Hls = null;
try {
  // hls.js is an optional dependency; import only if present to avoid breaking builds
  // If you use CRA or Vite, add `hls.js` to your dependencies for full HLS support.
  Hls = require("hls.js");
} catch (e) {
  Hls = null;
}

// Expo FileSystem is used only in React Native / Expo builds. This is a soft integration
// that will no-op in web builds. DO NOT use this to download copyrighted material you do
// not have rights to. This downloader is provided for legitimate offline-capable media.
let FileSystem = null;
try {
  FileSystem = require("expo-file-system");
} catch (e) {
  FileSystem = null;
}

// Environment helpers (supports CRA, Vite, Next, and common setups)
const env = (key, fallback = "") => {
  return (
    (typeof process !== "undefined" && process.env && process.env[key]) ||
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) ||
    fallback
  );
};

// Primary configuration: read TMDB API key from environment variables.
const TMDB_API_KEY = env("REACT_APP_TMDB_API_KEY", env("VITE_TMDB_API_KEY", ""));
const TMDB_BASE = "https://api.themoviedb.org/3";

// AdMob / sensitive IDs must never be checked into source; read them from env only.
// The app enforces presence at runtime but never logs them.
const ADMOB_ID = env("REACT_APP_ADMOB_ID", "");

// NOTE (anti-hack): For Android builds, add Proguard rules in `android/app/proguard-rules.pro`:
// -keepclassmembers class ** { private static final java.lang.String ADMOB_*; }
// Keep AdMob IDs out of plain text by injecting via CI secrets and build config at compile time.
// Example (Gradle):
// buildTypes {
//   release {
//     buildConfigField "String", "ADMOB_ID", '"' + System.getenv("ADMOB_ID") + '"'
//   }
// }
// Also use an obfuscation/minification step in your CI pipeline. Do NOT commit real keys to git.

// Utility: build TMDB queries with API key
const tmdbGet = async (path, params = {}) => {
  if (!TMDB_API_KEY) throw new Error("TMDB API key is not set in environment variables.");
  const url = `${TMDB_BASE}${path}`;
  const res = await axios.get(url, {
    params: { api_key: TMDB_API_KEY, language: "en-US", ...params },
  });
  return res.data;
};

// Small helper to prioritize Hindi-dubbed and Bollywood titles in lists
const prioritizeHindiBollywood = (items = []) => {
  const score = (it) => {
    const title = (it.title || it.name || "").toLowerCase();
    const overview = (it.overview || "").toLowerCase();
    let s = 0;
    // TMDB original_language field
    if (it.original_language === "hi") s += 50;
    // Keywords in title/overview indicating Hindi / dubbed / Bollywood
    if (title.includes("hindi") || overview.includes("hindi")) s += 40;
    if (title.includes("dub") || overview.includes("dubbed")) s += 30;
    if (title.includes("bollywood") || overview.includes("bollywood")) s += 60;
    // popularity boost
    s += (it.popularity || 0) / 100;
    return s;
  };
  return items
    .map((it) => ({ it, s: score(it) }))
    .sort((a, b) => b.s - a.s)
    .map((r) => r.it);
};

export default function App() {
  const [tab, setTab] = useState("movies");

  // Hindi/Bollywood top container
  const [topHindi, setTopHindi] = useState([]);

  // Movies
  const [movies, setMovies] = useState([]);
  const [movieQuery, setMovieQuery] = useState("");

  // TV / Web Series
  const [seriesQuery, setSeriesQuery] = useState("");
  const [seriesResults, setSeriesResults] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);

  // Player
  const videoRef = useRef(null);
  const [playingSrc, setPlayingSrc] = useState("");
  const [isHlsAttached, setHlsAttached] = useState(false);

  useEffect(() => {
    // On mount, fetch trending and highlight Hindi/Bollywood entries
    (async () => {
      try {
        const trendingMovies = await tmdbGet("/trending/movie/week");
        const trendingTv = await tmdbGet("/trending/tv/week");
        const merged = [(trendingMovies.results || []), (trendingTv.results || [])].flat();
        const prioritized = prioritizeHindiBollywood(merged).slice(0, 8);
        setTopHindi(prioritized);
      } catch (e) {
        // silent fail; show nothing in top container
        console.warn("Failed to load trending for topHindi container.");
      }
    })();
  }, []);

  // Movie search / discover
  useEffect(() => {
    const doSearch = async () => {
      try {
        let data;
        if (!movieQuery) {
          data = await tmdbGet("/movie/popular", { page: 1 });
        } else {
          data = await tmdbGet("/search/movie", { query: movieQuery, include_adult: false });
        }
        const prioritized = prioritizeHindiBollywood(data.results || []);
        setMovies(prioritized);
      } catch (e) {
        console.error(e);
      }
    };
    doSearch();
  }, [movieQuery]);

  // Series search
  useEffect(() => {
    const doSearch = async () => {
      try {
        let data;
        if (!seriesQuery) {
          data = await tmdbGet("/tv/popular", { page: 1 });
        } else {
          data = await tmdbGet("/search/tv", { query: seriesQuery });
        }
        setSeriesResults(data.results || []);
      } catch (e) {
        console.error(e);
      }
    };
    doSearch();
  }, [seriesQuery]);

  // When user selects a series, load seasons metadata
  useEffect(() => {
    const loadSeasons = async () => {
      if (!selectedSeries) return;
      try {
        const tv = await tmdbGet(`/tv/${selectedSeries.id}`);
        setSeasons(tv.seasons || []);
        if (tv.seasons && tv.seasons.length > 0) {
          // auto-select last aired season by default
          const last = tv.seasons[tv.seasons.length - 1];
          setSelectedSeason(last.season_number || last.seasonNumber || 1);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSeasons();
  }, [selectedSeries]);

  // When season selected, load episodes
  useEffect(() => {
    const loadEpisodes = async () => {
      if (!selectedSeries || !selectedSeason) return;
      try {
        const data = await tmdbGet(`/tv/${selectedSeries.id}/season/${selectedSeason}`);
        setEpisodes(data.episodes || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadEpisodes();
  }, [selectedSeason, selectedSeries]);

  // Attach HLS when playingSrc changes (for HLS URLs)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!playingSrc) {
      if (Hls && isHlsAttached) {
        // detach if previously attached
        try {
          const hls = Hls.instances && Hls.instances[0];
          if (hls) hls.destroy();
        } catch (e) {}
        setHlsAttached(false);
      }
      video.pause();
      video.removeAttribute("src");
      return;
    }

    const isHls = playingSrc.endsWith(".m3u8") || playingSrc.includes("/hls/");
    if (isHls && Hls && Hls.isSupported()) {
      try {
        const hls = new Hls();
        hls.loadSource(playingSrc);
        hls.attachMedia(video);
        setHlsAttached(true);
        video.play().catch(() => {});
      } catch (e) {
        console.warn("HLS attach failed", e);
      }
    } else {
      // direct src (mp4, webm)
      video.src = playingSrc;
      video.play().catch(() => {});
    }
  }, [playingSrc]);

  // Download media helper (expo-file-system when available)
  const downloadMedia = async (url, filename) => {
    if (!url) return alert("No downloadable URL available");
    // Safety: warn user about copyright
    if (!confirm("Make sure you have rights to download this media. Continue?")) return;

    if (FileSystem && FileSystem.createDownloadResumable) {
      try {
        const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
        const path = `${dir}${filename}`;
        const downloadResumable = FileSystem.createDownloadResumable(url, path, {}, (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / (downloadProgress.totalBytesExpectedToWrite || 1);
          // Could surface progress to UI
          // console.log('progress', progress);
        });
        const result = await downloadResumable.downloadAsync();
        alert(`Downloaded to ${result.uri}`);
      } catch (e) {
        console.error(e);
        alert("Download failed. See console for details.");
      }
    } else if (typeof window !== "undefined" && window.fetch) {
      // Web fallback: use fetch and stream to IndexedDB / blob (limited). We'll trigger a save via anchor.
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
        alert("Download started in browser. Check your downloads folder.");
      } catch (e) {
        console.error(e);
        alert("Browser download failed.");
      }
    } else {
      alert("Download not supported in this environment.");
    }
  };

  // Render small card
  const Card = ({ item, onPlay }) => {
    const img = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : "";
    return (
      <div style={{ width: 180, margin: 8, cursor: "pointer" }}>
        {img ? <img src={img} alt="poster" style={{ width: "100%", borderRadius: 8 }} /> : <div style={{ height: 270, background: "#222" }} />}
        <div style={{ fontWeight: 700, marginTop: 6 }}>{item.title || item.name}</div>
        <div style={{ fontSize: 12, color: "#aaa" }}>{item.release_date || item.first_air_date}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={() => onPlay(item)}>Play</button>
        </div>
      </div>
    );
  };

  // When user clicks Play on a movie/episode, we attempt to find a playable stream URL.
  // TMDB does not provide raw stream URLs. This UI assumes you will provide a direct stream URL
  // via the "external_stream" field on your records or via a custom mapping. The app will not
  // perform any scraping or bypass any protection. You must supply lawful stream URLs.
  const handlePlayMovie = async (movie) => {
    // Example: If movie has `external_stream` property, use it. Otherwise show a simple details modal.
    if (movie.external_stream) {
      setPlayingSrc(movie.external_stream);
      return;
    }
    // For demo: try TMDB's videos endpoint to find trailers (not full content) - safe to use
    try {
      const vids = await tmdbGet(`/movie/${movie.id}/videos`);
      const first = (vids.results || [])[0];
      if (first && first.site === "YouTube") {
        // YouTube embed is not a direct file; we won't attempt to stream it via the raw player.
        alert("Trailer available on YouTube. This app plays raw stream files; YouTube must open in an approved webview.");
        return;
      }
      alert("No direct stream URL found for this title. Provide an `external_stream` property in your source to play.");
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayEpisode = (episode) => {
    if (episode.external_stream) {
      setPlayingSrc(episode.external_stream);
      return;
    }
    alert("No direct stream URL available for this episode. Provide an external_stream property.");
  };

  // Minimal CSS-in-JS for layout
  const containerStyle = { padding: 20, fontFamily: "Inter, Roboto, sans-serif", color: "#fff", background: "#0b0b0b", minHeight: "100vh" };

  return (
    <div style={containerStyle}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>sijjmovieshub</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("movies")} style={{ fontWeight: tab === "movies" ? "700" : "400" }}>
            Movies
          </button>
          <button onClick={() => setTab("series")} style={{ fontWeight: tab === "series" ? "700" : "400" }}>
            Web Series
          </button>
        </div>
      </header>

      {/* Top Hindi / Bollywood container */}
      <section style={{ marginTop: 18, marginBottom: 18 }}>
        <h2>Trending — Hindi / Bollywood Highlights</h2>
        <div style={{ display: "flex", overflowX: "auto", gap: 12 }}>
          {topHindi.map((t) => (
            <div key={t.id} style={{ minWidth: 220 }}>
              <Card item={t} onPlay={handlePlayMovie} />
            </div>
          ))}
        </div>
      </section>

      {/* Player */}
      <section style={{ marginBottom: 18 }}>
        <div style={{ background: "#000", padding: 8, borderRadius: 8 }}>
          <video ref={videoRef} controls style={{ width: "100%", maxHeight: 480 }} />
        </div>
      </section>

      {/* Main content by tab */}
      {tab === "movies" ? (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input value={movieQuery} onChange={(e) => setMovieQuery(e.target.value)} placeholder="Search movies..." />
            <small style={{ color: "#888" }}>Language filter: Hindi dubbed and Bollywood titles are prioritized automatically.</small>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 16 }}>
            {movies.map((m) => (
              <Card key={m.id} item={m} onPlay={handlePlayMovie} />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input value={seriesQuery} onChange={(e) => setSeriesQuery(e.target.value)} placeholder="Search web series..." />
            <div style={{ marginLeft: "auto" }}>
              {/* When a series is selected, show season selector */}
              {selectedSeries && (
                <select value={selectedSeason || ""} onChange={(e) => setSelectedSeason(Number(e.target.value))}>
                  {(seasons || []).map((s) => (
                    <option value={s.season_number} key={s.id || s.season_number}>
                      {s.name} (Season {s.season_number})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <h3>Series Results</h3>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {seriesResults.map((s) => (
                  <div
                    key={s.id}
                    style={{ width: 220, margin: 8, cursor: "pointer" }}
                    onClick={() => {
                      setSelectedSeries(s);
                      setEpisodes([]);
                    }}
                  >
                    <Card item={s} onPlay={() => alert("Select a season and episode to play.")} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: 520 }}>
              <h3>
                {selectedSeries ? `${selectedSeries.name} — Season ${selectedSeason || "?"}` : "Select a series to view seasons & episodes"}
              </h3>

              {/* Episodes grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {(episodes || []).map((ep) => (
                  <div key={ep.id || ep.episode_number} style={{ background: "#111", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{ep.name}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>Episode {ep.episode_number}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button onClick={() => handlePlayEpisode(ep)}>Play</button>
                      <button
                        onClick={() =>
                          // If episode provides an external_stream, use it for download; otherwise this will be blocked by rights
                          downloadMedia(ep.external_stream || "", `${(selectedSeries && selectedSeries.name) || "show"}_S${selectedSeason}_E${ep.episode_number}.mp4`)
                        }
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer: show sanitized presence of ADMOB_ID but never print actual value */}
      <footer style={{ marginTop: 28, color: "#666" }}>
        <small>
          Build mode: {process.env.NODE_ENV || "unknown"} — AdMob configured: {ADMOB_ID ? "yes (hidden)" : "no"}
        </small>
      </footer>
    </div>
  );
}
