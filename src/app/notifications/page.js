
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadNotifications() {
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load notifications.");
      }

      setNotifications(data.notifications || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(notificationId) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update notification.");
      }

      await loadNotifications();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update notifications.");
      }

      await loadNotifications();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-blue-700">
          ← Back to Home
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Notifications
            </h1>

            <p className="mt-2 text-gray-600">
              Updates about your lost and found claims.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={busy}
              className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {!loading && !error && (
          <p className="mt-6 text-sm text-gray-500">
            {unreadCount} unread notification(s)
          </p>
        )}

        {loading && (
          <p className="mt-8 text-gray-600">Loading notifications...</p>
        )}

        {error && (
          <p className="mt-8 text-red-600">{error}</p>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="mt-8 rounded-xl border bg-white p-8 text-gray-500">
            You have no notifications yet.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`rounded-xl border p-6 shadow-sm ${
                notification.is_read
                  ? "border-gray-200 bg-white"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-600">
                    {notification.is_read ? "Read" : "Unread"}
                  </p>
                </div>

                {!notification.is_read && (
                  <button
                    onClick={() =>
                      markRead(notification.notification_id)
                    }
                    disabled={busy}
                    className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
