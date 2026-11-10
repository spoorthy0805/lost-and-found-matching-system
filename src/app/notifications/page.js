
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

  useEffect(() => {
    async function load() {
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

    load();
  }, [router]);

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

  async function markRead(notificationId) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
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

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const readCount = notifications.length - unreadCount;

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
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
            <span className="pixel-badge bg-[#ffab66]">
              ACCOUNT UPDATES
            </span>

            <h1 className="pixel-title mt-6 text-4xl sm:text-5xl">
              NOTIFICATIONS
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[#575c72]">
              Stay updated on your lost and found reports,
              potential matches, and claim activity.
            </p>
          </div>

          <div className="mb-10 grid gap-5 sm:grid-cols-3">
            <div className="pixel-card bg-[#b7dcf4] p-6 text-center">
              <p className="pixel-title text-4xl">
                {loading ? "..." : notifications.length}
              </p>

              <p className="mt-2 font-mono text-xs font-black">
                TOTAL NOTIFICATIONS
              </p>
            </div>

            <div className="pixel-card bg-[#ffab66] p-6 text-center">
              <p className="pixel-title text-4xl">
                {loading ? "..." : unreadCount}
              </p>

              <p className="mt-2 font-mono text-xs font-black">
                UNREAD
              </p>
            </div>

            <div className="pixel-card bg-[#a8d5a2] p-6 text-center">
              <p className="pixel-title text-4xl">
                {loading ? "..." : readCount}
              </p>

              <p className="mt-2 font-mono text-xs font-black">
                READ
              </p>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="pixel-title text-xl">
                YOUR UPDATES
              </h2>

              <p className="mt-2 text-sm text-[#575c72]">
                {unreadCount === 0
                  ? "You're all caught up!"
                  : `You have ${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }.`}
              </p>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={busy || loading || unreadCount === 0}
              className="pixel-button pixel-button-green"
            >
              {busy ? "UPDATING..." : "MARK ALL AS READ"}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-7 border-[3px] border-[#252a46] bg-[#f4a8b8] p-5"
            >
              <p className="font-mono text-xs font-black">
                SOMETHING WENT WRONG
              </p>

              <p className="mt-2 text-sm">
                {error}
              </p>
            </div>
          )}

          {loading && (
            <div className="pixel-card bg-white p-10 text-center">
              <p className="pixel-title text-xl">
                LOADING NOTIFICATIONS...
              </p>

              <p className="mt-3 text-sm text-[#575c72]">
                Retrieving your latest updates.
              </p>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="pixel-card bg-[#fffdf5] p-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-[#252a46] bg-[#b7dcf4] text-4xl shadow-[4px_4px_0_#252a46]">
                🔔
              </div>

              <h2 className="pixel-title text-2xl">
                NO NOTIFICATIONS YET
              </h2>

              <p className="mx-auto mt-4 max-w-md text-[#575c72]">
                You don't have any notifications right now.
                Updates about your reports and claims will
                appear here.
              </p>

              <Link
                href="/matches"
                className="pixel-button pixel-button-orange mt-7"
              >
                VIEW POTENTIAL MATCHES →
              </Link>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="space-y-6">
              {notifications.map((notification) => {
                const isRead = Boolean(notification.is_read);

                return (
                  <article
                    key={notification.notification_id}
                    className={`pixel-card p-5 sm:p-7 ${
                      isRead ? "bg-[#fffdf5]" : "bg-[#fff0d8]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start gap-5">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center border-[3px] border-[#252a46] text-2xl shadow-[3px_3px_0_#252a46] ${
                          isRead
                            ? "bg-[#b7dcf4]"
                            : "bg-[#ffab66]"
                        }`}
                      >
                        🔔
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span
                            className={`pixel-badge ${
                              isRead
                                ? "bg-[#a8d5a2]"
                                : "bg-[#ffab66]"
                            }`}
                          >
                            {isRead ? "READ" : "UNREAD"}
                          </span>

                          {notification.created_at && (
                            <span className="font-mono text-xs font-bold text-[#575c72]">
                              {formatDate(notification.created_at)}
                            </span>
                          )}
                        </div>

                        {notification.title && (
                          <h3 className="pixel-title mt-4 break-words text-lg">
                            {notification.title}
                          </h3>
                        )}

                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#575c72]">
                          {notification.message}
                        </p>

                        {!isRead && (
                          <div className="mt-5 border-t-2 border-dashed border-[#252a46] pt-5">
                            <button
                              type="button"
                              onClick={() =>
                                markRead(notification.notification_id)
                              }
                              disabled={busy}
                              className="pixel-button bg-[#b7dcf4] text-xs"
                            >
                              {busy ? "UPDATING..." : "MARK AS READ"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
