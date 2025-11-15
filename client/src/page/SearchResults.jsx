// src/page/SearchResults.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, Link, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * compute Levenshtein distance between two strings
 * O(n*m) time, simple and reliable for moderate-sized strings.
 */
function levenshtein(a = "", b = "") {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;

  // ensure a is shorter to use less memory (optional)
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[n][m];
}

/**
 * Returns similarity in range [0,1]
 */
function similarityScore(a = "", b = "") {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const sa = a.toString().toLowerCase().trim();
  const sb = b.toString().toLowerCase().trim();
  const dist = levenshtein(sa, sb);
  const maxLen = Math.max(sa.length, sb.length);
  if (maxLen === 0) return 0;
  return 1 - dist / maxLen;
}

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // support both ?q= and ?query=
  const params = new URLSearchParams(location.search);
  const q = (params.get("q") || params.get("query") || "").trim();

  useEffect(() => {
    let cancelled = false;
    const MATCH_THRESHOLD = 0.6; // 60% similarity threshold for names

    // client-side fuzzy filter (name similarity + substring fallback)
    const clientFilterFuzzy = (allPosts, term) => {
      if (!term) return [];

      const t = term.toLowerCase().trim();

      // produce array of { post, score } then filter by threshold and sort
      const scored = allPosts.map((p) => {
        const title = (p.title || p.name || "").toLowerCase();
        const desc = (p.description || p.desc || p.body || "").toLowerCase();
        const cat = (p.category?.name || p.category || "").toLowerCase();
        const other = (p.hotelLocation || "").toLowerCase();

        // exact substring matches get a high base score
        if (title.includes(t)) {
          // high score for direct substring match (boost)
          return { post: p, score: 1.0 };
        }

        // compute similarity on title
        const nameScore = similarityScore(title, t); // 0..1

        // small boosts for substring matches in other fields
        const descBoost = desc.includes(t) ? 0.5 : 0;
        const catBoost = cat.includes(t) ? 0.4 : 0;
        const otherBoost = other.includes(t) ? 0.3 : 0;

        // composite score: weighted combination
        const composite = Math.max(nameScore, 0) + descBoost + catBoost + otherBoost;

        return { post: p, score: composite };
      });

      // keep only items with a strong name match OR decent composite score
      const filtered = scored
        .filter(({ score, post }) => {
          // accept if name similarity alone >= threshold OR composite score >= threshold
          const title = (post.title || post.name || "").toLowerCase();
          const nameOnlyScore = similarityScore(title, t);
          return nameOnlyScore >= MATCH_THRESHOLD || score >= MATCH_THRESHOLD;
        })
        .sort((a, b) => b.score - a.score) // best matches first
        .map((s) => s.post);

      return filtered;
    };

    const fetchResults = async () => {
      if (!q) {
        setPosts([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setPosts([]);

      try {
        // first try backend search (server-side fulltext or exact match)
        const searchRes = await axios.get(`${API_BASE}/api/post/search`, {
          params: { query: q },
        });

        if (cancelled) return;

        const backendPosts = Array.isArray(searchRes.data?.posts)
          ? searchRes.data.posts
          : [];

        // if backend found results, apply fuzzy filtering to sort/prioritize them
        if (backendPosts.length > 0) {
          const prioritized = clientFilterFuzzy(backendPosts, q);
          setPosts(prioritized.length > 0 ? prioritized : backendPosts);
          setLoading(false);
          return;
        }

        // if backend returned empty, fetch all posts and apply client fuzzy filter
        const allRes = await axios.get(`${API_BASE}/api/post/get-all-posts`);
        if (cancelled) return;

        const allPosts = Array.isArray(allRes.data?.posts)
          ? allRes.data.posts
          : Array.isArray(allRes.data)
          ? allRes.data
          : [];

        const filtered = clientFilterFuzzy(allPosts, q);

        if (filtered.length > 0) {
          setPosts(filtered);
          setLoading(false);
          return;
        }

        // If still nothing, show friendly no-results message
        setPosts([]);
        setError(`No results found for “${q}”.`);
      } catch (err) {
        console.error("Search error:", err);
        // fallback: try to fetch all posts and filter
        try {
          const fallback = await axios.get(`${API_BASE}/api/post/get-all-posts`);
          if (cancelled) return;
          const allPosts = Array.isArray(fallback.data?.posts)
            ? fallback.data.posts
            : Array.isArray(fallback.data)
            ? fallback.data
            : [];
          const filtered = clientFilterFuzzy(allPosts, q);
          if (filtered.length > 0) {
            setPosts(filtered);
            setError("");
          } else {
            setPosts([]);
            setError(`No results found for “${q}”.`);
          }
        } catch (err2) {
          console.error("Fallback fetch failed:", err2);
          setError("Error fetching search results. Please try again later.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [q]);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">Searching for “{q}”...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <div className="mb-4">{error}</div>
        <div>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No results found for “{q}”.
        <div className="mt-4">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 mt-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Search Results for “{q}”</h1>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:underline">
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {posts.map((post) => (
          <div
            key={post._id || post.id}
            className="border rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col cursor-pointer"
            onClick={() => navigate(`/product/${post.slug}`)}
          >
            <img
              src={
                post.images?.[0] ||
                post.category?.image ||
                "https://via.placeholder.com/300x200?text=No+Image"
              }
              alt={post.title}
              className="h-48 w-full object-cover"
            />
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h2 className="font-semibold text-lg mb-1">{post.title}</h2>
              <p className="text-gray-500 text-sm mb-2">
                {post.hotelLocation ? `${post.hotelLocation.slice(0, 80)}...` : (post.description ? `${post.description.slice(0,80)}...` : "")}
              </p>
              <div className="mt-2 flex justify-between items-center text-gray-700 text-sm font-medium">
                <span>₹{post.price}</span>
                <span>{post.isAvailable ? "Available" : "Unavailable"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default SearchResults;
