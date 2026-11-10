
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage("Login successful! Redirecting...");
        router.push("/");
        router.refresh();
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch {
      setMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pixel-grid min-h-screen bg-[#fff8e8] px-5 py-8 text-[#252a46]">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center border-[3px] border-[#252a46] bg-[#ffab66] font-mono text-2xl font-black shadow-[3px_3px_0_#252a46]">
              ?
            </div>

            <div>
              <p className="pixel-title text-lg">
                LOST & FOUND
              </p>
              <p className="font-mono text-[10px] font-bold tracking-widest text-[#575c72]">
                CAMPUS MANAGEMENT SYSTEM
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="pixel-button bg-white text-xs"
          >
            ← BACK TO HOME
          </Link>
        </header>

        <section className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-12 py-14 lg:grid-cols-2">
          <div className="hidden lg:block">
            <span className="pixel-badge bg-[#a8d5a2]">
              CAMPUS LOST & FOUND
            </span>

            <h1 className="pixel-title mt-8 text-5xl leading-tight">
              EVERY ITEM
              <span className="block text-[#548ac3]">
                DESERVES
              </span>
              A WAY BACK.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-[#575c72]">
              Sign in to report lost belongings, browse
              found items, track your reports, and receive
              updates about potential matches.
            </p>

            <div className="pixel-card mt-9 max-w-sm bg-[#b7dcf4] p-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🔑", name: "KEYS", color: "#fff8e8" },
                  { icon: "🎒", name: "BAGS", color: "#ffab66" },
                  { icon: "📱", name: "DEVICES", color: "#a8d5a2" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex flex-col items-center gap-2 border-[3px] border-[#252a46] p-4"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="font-mono text-[10px] font-black">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-center font-mono text-xs font-black">
                REPORT • SEARCH • RECONNECT
              </p>
            </div>
          </div>

          <div className="w-full max-w-md justify-self-center">
            <div className="mb-7 text-center">
              <span className="pixel-badge bg-[#ffab66]">
                ACCOUNT ACCESS
              </span>

              <h2 className="pixel-title mt-5 text-4xl">
                WELCOME BACK
              </h2>

              <p className="mt-3 text-[#575c72]">
                Sign in to your Lost & Found account.
              </p>
            </div>

            <div className="pixel-card bg-[#fffdf5] p-6 sm:p-9">
              <div className="mb-7 flex items-center justify-between border-b-[3px] border-dashed border-[#252a46] pb-4 font-mono text-xs font-black">
                <span>SIGN IN</span>
                <span className="text-[#548ac3]">
                  SECURE ACCESS
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block font-mono text-xs font-black"
                  >
                    EMAIL ADDRESS
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="pixel-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block font-mono text-xs font-black"
                  >
                    PASSWORD
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    className="pixel-input"
                  />
                </div>

                {message && (
                  <div
                    role="status"
                    className={`border-[3px] border-[#252a46] p-3 text-sm font-semibold ${
                      success
                        ? "bg-[#a8d5a2]"
                        : "bg-[#f4a8b8]"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="pixel-button pixel-button-orange w-full"
                >
                  {loading ? "SIGNING IN..." : "SIGN IN →"}
                </button>
              </form>

              <div className="mt-8 border-t-[3px] border-dashed border-[#252a46] pt-6 text-center">
                <p className="text-sm text-[#575c72]">
                  Don't have an account?
                </p>

                <Link
                  href="/register"
                  className="mt-3 inline-block font-mono text-sm font-black underline underline-offset-4"
                >
                  CREATE AN ACCOUNT →
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center font-mono text-xs font-bold text-[#75788c]">
              CAMPUS LOST & FOUND SYSTEM
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
