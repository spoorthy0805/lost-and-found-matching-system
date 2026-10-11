
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

        setItems(data.items);
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
      title: item.title,
      description: item.description,
      location: item.location,
      date_found_lost: String(item.date_found_lost).slice(0, 10),
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

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-blue-700 hover:underline">
          ← Back to Home
        </Link>

        <h1 className="mb-3 mt-8 text-3xl font-bold text-gray-900">
          My Reports
        </h1>

        <p className="mb-8 text-gray-600">
          View and manage the lost and found items you have reported.
        </p>

        {loading ? (
          <p className="text-gray-600">Loading your reports...</p>
        ) : error ? (
          <div className="rounded-lg border bg-white p-6">
            <p className="mb-3 text-red-600">{error}</p>

            <Link href="/login" className="text-blue-700 hover:underline">
              Go to Login
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center">
            <p className="mb-4 text-gray-600">
              You haven't reported any items yet.
            </p>

            <Link href="/report-lost" className="text-blue-700 hover:underline">
              Report an Item
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.item_id}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      item.item_type === "LOST"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.item_type}
                  </span>

                  <span className="text-sm text-gray-500">
                    {item.status}
                  </span>
                </div>

                {editingId === item.item_id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveReport(item.item_id);
                    }}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="Title"
                      className="w-full rounded-lg border px-4 py-2 text-gray-900"
                    />

                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Description"
                      className="w-full rounded-lg border px-4 py-2 text-gray-900"
                    />

                    <input
                      type="text"
                      required
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                      placeholder="Location"
                      className="w-full rounded-lg border px-4 py-2 text-gray-900"
                    />

                    <input
                      type="date"
                      required
                      value={form.date_found_lost}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          date_found_lost: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border px-4 py-2 text-gray-900"
                    />

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        className="rounded-lg border px-5 py-2 font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2 className="mb-2 text-xl font-bold text-gray-900">
                      {item.title}
                    </h2>

                    <p className="mb-4 whitespace-pre-wrap break-words text-gray-600">
                      {item.description}
                    </p>

                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Category:</strong> {item.category_name}</p>
                      <p><strong>Location:</strong> {item.location}</p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {String(item.date_found_lost).slice(0, 10)}
                      </p>
                    </div>

                    {item.status === "OPEN" && (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => startEditing(item)}
                          className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800"
                        >
                          Edit Report
                        </button>

                        <button
                          onClick={() => deleteReport(item.item_id)}
                          disabled={deletingId === item.item_id}
                          className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === item.item_id
                            ? "Deleting..."
                            : "Delete Report"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
