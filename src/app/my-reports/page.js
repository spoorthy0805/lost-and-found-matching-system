
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MyReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date_found_lost: "",
  });

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch("/api/my-reports", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load reports.");
        }

        setItems(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  function startEditing(item) {
    setEditingId(item.item_id);

    setForm({
      title: item.title || "",
      description: item.description || "",
      location: item.location || "",
      date_found_lost: String(item.date_found_lost || "").slice(0, 10),
    });
  }

  async function saveReport(itemId) {
    setSaving(true);

    try {
      const response = await fetch(`/api/my-reports/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update report.");
      }

      setItems((previous) =>
        previous.map((item) =>
          item.item_id === itemId
            ? {
                ...item,
                title: form.title.trim(),
                description: form.description.trim(),
                location: form.location.trim(),
                date_found_lost: form.date_found_lost,
              }
            : item
        )
      );

      setEditingId(null);
      alert("Report updated successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteReport(itemId) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this report from public listings?"
    );

    if (!confirmed) return;

    setDeletingId(itemId);

    try {
      const response = await fetch(`/api/my-reports/${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete report.");
      }

      setItems((previous) =>
        previous.map((item) =>
          item.item_id === itemId
            ? { ...item, status: "CLOSED" }
            : item
        )
      );

      alert("Report removed from public listings.");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const lostCount = items.filter(
    (item) => item.item_type === "LOST"
  ).length;

  const foundCount = items.filter(
    (item) => item.item_type === "FOUND"
  ).length;

  const activeCount = items.filter(
    (item) => item.status !== "CLOSED"
  ).length;

  return (
    <main className="pixel-grid min-h-screen bg-[#fff8e8] px-5 py-8 text-[#252a46]">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
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

          <Link href="/" className="pixel-button bg-white text-xs">
            ← BACK TO HOME
          </Link>
        </header>

        <section className="mx-auto max-w-5xl py-14">
          <div className="mb-10 text-center">
            <span className="pixel-badge bg-[#b7dcf4]">
              YOUR SUBMITTED REPORTS
            </span>

            <h1 className="pixel-title mt-6 text-4xl sm:text-5xl">
              MY REPORTS
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[#575c72]">
              View and manage the lost and found items
              you have reported.
            </p>
          </div>

          <div className="mb-10 grid gap-5 sm:grid-cols-3">
            <div className="pixel-card bg-[#f4a8b8] p-6 text-center">
              <p className="pixel-title text-4xl">
                {loading ? "..." : lostCount}
              </p>
              <p className="mt-2 font-mono text-xs font-black">
                LOST REPORTS
              </p>
            </div>

            <div className="pixel-card bg-[#a8d5a2] p-6 text-center">
              <p className="pixel-title text-4xl">
                {loading ? "..." : foundCount}
              </p>
              <p className="mt-2 font-mono text-xs font-black">
                FOUND REPORTS
              </p>
            </div>

            <div className="pixel-card bg-[#b7dcf4] p-6 text-center">
              <p className="pixel-title text-4xl">
                {loading ? "..." : activeCount}
              </p>
              <p className="mt-2 font-mono text-xs font-black">
                OPEN REPORTS
              </p>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-4">
            <Link
              href="/report-lost"
              className="pixel-button pixel-button-orange"
            >
              + REPORT LOST ITEM
            </Link>

            <Link
              href="/report-found"
              className="pixel-button pixel-button-green"
            >
              + REPORT FOUND ITEM
            </Link>
          </div>

          {loading && (
            <div className="pixel-card bg-white p-10 text-center">
              <p className="pixel-title text-xl">
                LOADING REPORTS...
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="pixel-card bg-[#f4a8b8] p-8 text-center"
            >
              <p className="pixel-title text-xl">
                UNABLE TO LOAD REPORTS
              </p>
              <p className="mt-3 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="pixel-card bg-[#fffdf5] p-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-[#252a46] bg-[#b7dcf4] text-4xl shadow-[4px_4px_0_#252a46]">
                📋
              </div>

              <h2 className="pixel-title text-2xl">
                NO REPORTS YET
              </h2>

              <p className="mt-4 text-[#575c72]">
                You haven't submitted any lost or found
                item reports yet.
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-7">
              {items.map((item) => {
                const isLost = item.item_type === "LOST";
                const isClosed = item.status === "CLOSED";
                const isEditing = editingId === item.item_id;

                return (
                  <article
                    key={item.item_id}
                    className="pixel-card bg-[#fffdf5] p-5 sm:p-8"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b-[3px] border-dashed border-[#252a46] pb-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-3">
                          <span
                            className={`pixel-badge ${
                              isLost
                                ? "bg-[#f4a8b8]"
                                : "bg-[#a8d5a2]"
                            }`}
                          >
                            {item.item_type}
                          </span>

                          <span
                            className={`pixel-badge ${
                              isClosed
                                ? "bg-[#e5e5e5]"
                                : "bg-[#b7dcf4]"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <h2 className="pixel-title mt-4 break-words text-xl sm:text-2xl">
                          {item.title}
                        </h2>
                      </div>

                      <div
                        className={`flex h-16 w-16 shrink-0 items-center justify-center border-[3px] border-[#252a46] text-3xl shadow-[4px_4px_0_#252a46] ${
                          isLost
                            ? "bg-[#f4a8b8]"
                            : "bg-[#a8d5a2]"
                        }`}
                      >
                        {isLost ? "🔎" : "📦"}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-7 space-y-5">
                        <h3 className="pixel-title text-lg">
                          EDIT REPORT
                        </h3>

                        <div>
                          <label
                            htmlFor={`title-${item.item_id}`}
                            className="mb-2 block font-mono text-xs font-black"
                          >
                            ITEM NAME
                          </label>

                          <input
                            id={`title-${item.item_id}`}
                            type="text"
                            value={form.title}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                title: e.target.value,
                              })
                            }
                            className="pixel-input"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`description-${item.item_id}`}
                            className="mb-2 block font-mono text-xs font-black"
                          >
                            DESCRIPTION
                          </label>

                          <textarea
                            id={`description-${item.item_id}`}
                            rows={4}
                            value={form.description}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                description: e.target.value,
                              })
                            }
                            className="pixel-input resize-y"
                          />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`location-${item.item_id}`}
                              className="mb-2 block font-mono text-xs font-black"
                            >
                              LOCATION
                            </label>

                            <input
                              id={`location-${item.item_id}`}
                              type="text"
                              value={form.location}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  location: e.target.value,
                                })
                              }
                              className="pixel-input"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`date-${item.item_id}`}
                              className="mb-2 block font-mono text-xs font-black"
                            >
                              DATE
                            </label>

                            <input
                              id={`date-${item.item_id}`}
                              type="date"
                              value={form.date_found_lost}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  date_found_lost: e.target.value,
                                })
                              }
                              className="pixel-input"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-3">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveReport(item.item_id)}
                            className="pixel-button pixel-button-green"
                          >
                            {saving
                              ? "SAVING..."
                              : "SAVE CHANGES"}
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setEditingId(null)}
                            className="pixel-button bg-white"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                          <div className="border-[3px] border-[#252a46] bg-[#fff8e8] p-5 sm:col-span-2">
                            <p className="font-mono text-xs font-black">
                              DESCRIPTION
                            </p>

                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#575c72]">
                              {item.description}
                            </p>
                          </div>

                          <div
                            className={`border-[3px] border-[#252a46] p-5 ${
                              isLost
                                ? "bg-[#fce1e7]"
                                : "bg-[#e2f0df]"
                            }`}
                          >
                            <p className="font-mono text-xs font-black">
                              {isLost
                                ? "LAST SEEN LOCATION"
                                : "FOUND LOCATION"}
                            </p>

                            <p className="mt-3 break-words text-sm">
                              {item.location}
                            </p>
                          </div>

                          <div className="border-[3px] border-[#252a46] bg-[#b7dcf4] p-5">
                            <p className="font-mono text-xs font-black">
                              {isLost
                                ? "DATE LOST"
                                : "DATE FOUND"}
                            </p>

                            <p className="mt-3 text-sm">
                              {String(item.date_found_lost).slice(0, 10)}
                            </p>
                          </div>
                        </div>

                        {!isClosed && (
                          <div className="mt-7 flex flex-wrap gap-4 border-t-[3px] border-dashed border-[#252a46] pt-6">
                            <button
                              type="button"
                              onClick={() => startEditing(item)}
                              className="pixel-button bg-[#b7dcf4]"
                            >
                              EDIT REPORT
                            </button>

                            <button
                              type="button"
                              disabled={deletingId === item.item_id}
                              onClick={() => deleteReport(item.item_id)}
                              className="pixel-button pixel-button-pink"
                            >
                              {deletingId === item.item_id
                                ? "CLOSING..."
                                : "CLOSE REPORT"}
                            </button>
                          </div>
                        )}

                        {isClosed && (
                          <div className="mt-7 border-[3px] border-[#252a46] bg-[#e5e5e5] p-4">
                            <p className="font-mono text-xs font-black">
                              THIS REPORT IS CLOSED
                            </p>
                            <p className="mt-2 text-sm text-[#575c72]">
                              This item is no longer shown
                              in public listings.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <p className="mt-12 text-center font-mono text-xs font-bold text-[#75788c]">
            CAMPUS LOST & FOUND SYSTEM
          </p>
        </section>
      </div>
    </main>
  );
}
