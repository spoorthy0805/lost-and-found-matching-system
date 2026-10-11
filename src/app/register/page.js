
"use client";

import { useState } from "react";
import Link from "next/link";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Registration successful! You can now log in.");
        setForm({
          name: "",
          email: "",
          phone: "",
          password: "",
        });
      } else {
        setMessage(data.message || "Registration failed.");
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
            Student Registration
          </h1>

          <p className="mb-8 text-gray-600">
            Create an account to report lost and found items.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-gray-800">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-800">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={150}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-800">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={15}
                placeholder="Enter your phone number"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-800">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                maxLength={72}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>

            {message && (
              <p className="text-center text-sm text-blue-700" role="status">
                {message}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-700 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

