
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
        setMessage("Login successful! Redirecting...");
        router.push("/");
        router.refresh();
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (error) {
      setMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-blue-700 hover:underline">
          ← Back to Home
        </Link>

        <div className="mt-8 rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Student Login
          </h1>

          <p className="mb-8 text-gray-600">
            Log in to report lost and found items.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-gray-800">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-gray-800">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {message && (
              <p role="status" className="text-center text-sm text-blue-700">
                {message}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-700 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
