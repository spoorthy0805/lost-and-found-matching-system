
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ReportLost() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
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
    setSuccess(false);
    setMessage("Saving item...");

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          item_type: "LOST",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage("Lost item reported successfully!");
        setForm({
          title: "",
          description: "",
          category: "",
          location: "",
          date: "",
        });
      } else {
        setMessage(data.message || "Failed to save item.");
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
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-[3px] border-[#252a46] bg-[#ffab66] font-mono text-2xl font-black shadow-[3px_3px_0_#252a46]">
              ?
            </div>
            <div>
              <p className="pixel-title text-lg">LOST & FOUND</p>
              <p className="font-mono text-[10px] font-bold tracking-widest text-[#575c72]">
                CAMPUS MANAGEMENT SYSTEM
              </p>
            </div>
          </Link>

          <Link href="/" className="pixel-button bg-white text-xs">
            ← BACK TO HOME
          </Link>
        </header>

        <section className="mx-auto max-w-3xl py-14">
          <div className="mb-9 text-center">
            <span className="pixel-badge bg-[#f4a8b8]">
              LOST ITEM REPORT
            </span>

            <h1 className="pixel-title mt-6 text-4xl sm:text-5xl">
              REPORT A LOST ITEM
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[#575c72]">
              Provide the details of your lost belonging so
              we can help identify potential matches.
            </p>
          </div>

          <div className="pixel-card bg-[#fffdf5] p-6 sm:p-10">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-dashed border-[#252a46] pb-5">
              <span className="font-mono text-xs font-black">
                ITEM INFORMATION
              </span>
              <span className="pixel-badge bg-[#f4a8b8]">
                LOST
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="mb-2 block font-mono text-xs font-black">
                  ITEM NAME
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Black backpack"
                  value={form.title}
                  onChange={handleChange}
                  className="pixel-input"
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block font-mono text-xs font-black">
                  DESCRIPTION
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe the item, its color, brand, or identifying features..."
                  value={form.description}
                  onChange={handleChange}
                  className="pixel-input resize-y"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="mb-2 block font-mono text-xs font-black">
                    CATEGORY
                  </label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    required
                    placeholder="e.g. Electronics"
                    value={form.category}
                    onChange={handleChange}
                    className="pixel-input"
                  />
                </div>

                <div>
                  <label htmlFor="date" className="mb-2 block font-mono text-xs font-black">
                    DATE LOST
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={handleChange}
                    className="pixel-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="mb-2 block font-mono text-xs font-black">
                  LAST SEEN LOCATION
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  placeholder="e.g. Library, second floor"
                  value={form.location}
                  onChange={handleChange}
                  className="pixel-input"
                />
              </div>

              <div className="border-[3px] border-[#252a46] bg-[#b7dcf4] p-4">
                <p className="font-mono text-xs font-black">
                  HOW IT WORKS
                </p>
                <p className="mt-2 text-sm leading-6">
                  Once submitted, your report will be saved
                  and checked for potential matches with
                  found items using AI.
                </p>
              </div>

              {message && (
                <div
                  role="status"
                  className={`border-[3px] border-[#252a46] p-4 text-sm font-semibold ${
                    success ? "bg-[#a8d5a2]" : loading ? "bg-[#b7dcf4]" : "bg-[#f4a8b8]"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="pixel-button pixel-button-orange flex-1"
                >
                  {loading ? "SUBMITTING..." : "SUBMIT LOST REPORT →"}
                </button>

                <Link href="/" className="pixel-button bg-white">
                  CANCEL
                </Link>
              </div>
            </form>
          </div>

          <p className="mt-9 text-center font-mono text-xs font-bold text-[#75788c]">
            CAMPUS LOST & FOUND SYSTEM
          </p>
        </section>
      </div>
    </main>
  );
}
