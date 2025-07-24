"use client";
import { useState, useEffect, FormEvent } from "react";

const BACKEND_URL = "https://backend-url-shortner-kiu1.onrender.com";
const API_URL = BACKEND_URL;

export default function Home() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<Url[]>([]);
  const [longUrl, setLongUrl] = useState("");
  const [shortening, setShortening] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Load token from localStorage on mount
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      setToken(t);
      setView("dashboard");
    }
  }, []);

  // Fetch URLs when logged in
  useEffect(() => {
    if (token && view === "dashboard") {
      fetchUrls();
    }
    // eslint-disable-next-line
  }, [token, view]);

  async function fetchUrls() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/urls?limit=100&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch URLs");
      const data: Url[] = await res.json();
      setUrls(data);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Error fetching URLs");
      } else {
        setError("Error fetching URLs");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setView("dashboard");
      setUsername("");
      setPassword("");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Registration failed");
      setSuccessMsg("Registration successful! Please login.");
      setView("login");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleShorten(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShortening(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/urls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: longUrl }),
      });
      if (!res.ok) throw new Error("Failed to shorten URL");
      setLongUrl("");
      setSuccessMsg("URL shortened!");
      fetchUrls();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Shorten failed");
      } else {
        setError("Shorten failed");
      }
    } finally {
      setShortening(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this URL?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/urls/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchUrls();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Delete failed");
      } else {
        setError("Delete failed");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setView("login");
    setUrls([]);
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setSuccessMsg("Copied to clipboard!");
    setTimeout(() => setSuccessMsg(""), 1000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">URL Shortener</h1>
        {token && (
          <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-gray-400 hover:text-red-500">Logout</button>
        )}
        <div className="flex justify-center mb-6 gap-4">
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${view === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            onClick={() => setView('login')}
            disabled={!!token}
          >
            Login
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${view === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            onClick={() => setView('register')}
            disabled={!!token}
          >
            Register
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            onClick={() => setView('dashboard')}
            disabled={!token}
          >
            Dashboard
          </button>
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {successMsg && <div className="text-green-600 text-sm mb-2">{successMsg}</div>}
        {loading && <div className="text-blue-500 text-sm mb-2">Loading...</div>}
        {view === "login" && !token && (
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <input type="text" placeholder="Username" className="input input-bordered w-full" value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" className="input input-bordered w-full" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>Login</button>
          </form>
        )}
        {view === "register" && !token && (
          <form className="flex flex-col gap-4" onSubmit={handleRegister}>
            <input type="text" placeholder="Username" className="input input-bordered w-full" value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" className="input input-bordered w-full" value={password} onChange={e => setPassword(e.target.value)} required />
            <input type="password" placeholder="Confirm Password" className="input input-bordered w-full" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>Register</button>
          </form>
        )}
        {view === "dashboard" && token && (
          <div className="flex flex-col gap-6">
            <form className="flex flex-col gap-4" onSubmit={handleShorten}>
              <input type="url" placeholder="Paste your long URL here..." className="input input-bordered w-full" value={longUrl} onChange={e => setLongUrl(e.target.value)} required />
              <button type="submit" className="btn btn-primary w-full" disabled={shortening}>Shorten URL</button>
            </form>
            <div>
              <h2 className="text-lg font-semibold mb-2">Your Shortened URLs</h2>
              <ul className="space-y-2">
                {urls.length === 0 && <li className="text-gray-400">No URLs yet.</li>}
                {urls.map((u) => (
                  <li key={u.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <span className="truncate">{BACKEND_URL}/{u.id}</span>
                    <span className="text-xs text-gray-500 ml-2">Visits: {u.visit_count || 0}</span>
                    <button className="ml-2 text-blue-600 hover:underline" onClick={() => handleCopy(`${BACKEND_URL}/${u.id}`)}>Copy</button>
                    <button className="ml-2 text-red-500 hover:underline" onClick={() => handleDelete(u.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      <footer className="mt-8 text-gray-400 text-xs">&copy; {new Date().getFullYear()} URL Shortener</footer>
    </div>
  );
}

interface Url {
  id: string;
  long_url: string;
  short_url: string;
  visit_count: number;
}
