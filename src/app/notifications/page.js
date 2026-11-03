"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load notifications");
    setItems(data.notifications);
    setError("");
  }

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/notifications", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load notifications");
        return data.notifications;
      })
      .then((result) => {
        if (!controller.signal.aborted) {
          setItems(result);
          setError("");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function mark(notificationId, all = false) {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all ? { all: true } : { notificationId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-blue-700 underline">Home</Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <button disabled={busy || !items.some((x) => !x.is_read)} onClick={() => mark(null, true)} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-40">Mark all read</button>
        </div>
        {error && <p role="alert" className="rounded bg-red-100 p-3 text-red-700">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          items.map((n) => (
            <div key={n.notification_id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="mb-2">{n.message}</p>
              <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
                <span>{new Date(n.created_at).toLocaleString()} · {n.is_read ? "Read" : "Unread"}</span>
                {!n.is_read && <button disabled={busy} onClick={() => mark(n.notification_id)} className="text-blue-700 underline disabled:opacity-40">Mark read</button>}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
