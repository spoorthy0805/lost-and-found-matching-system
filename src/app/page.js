
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getItemIcon(item) {
  const text = `${item.title || ""} ${item.category_name || ""}`.toLowerCase();

  if (/bottle|flask|water|thermos|tumbler/.test(text)) return "🥤";
  if (/phone|mobile|iphone/.test(text)) return "📱";
  if (/laptop|computer|macbook/.test(text)) return "💻";
  if (/earphone|headphone|earbud|airpod/.test(text)) return "🎧";
  if (/wallet|purse/.test(text)) return "👛";
  if (/key|keychain/.test(text)) return "🔑";
  if (/id card|identity|student id|access card/.test(text)) return "🪪";
  if (/card|credit|debit/.test(text)) return "💳";
  if (/book|notebook|textbook/.test(text)) return "📚";
  if (/pen|pencil|stationery/.test(text)) return "✏️";
  if (/watch|smartwatch/.test(text)) return "⌚";
  if (/glasses|spectacles|sunglasses/.test(text)) return "👓";
  if (/umbrella/.test(text)) return "☂️";
  if (/charger|adapter|cable/.test(text)) return "🔌";
  if (/jacket|hoodie|shirt|clothing/.test(text)) return "👕";
  if (/bag|backpack|handbag/.test(text)) return "🎒";
  if (/document|certificate|paper/.test(text)) return "📄";
  if (/electronic|gadget/.test(text)) return "📱";
  if (/accessor/.test(text)) return "🔑";

  return "📦";
}

export default function Home() {
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState("");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setLoggedIn(true);
          setRole(data.user?.role || "");
        } else {
          setLoggedIn(false);
          setRole("");
        }
      } catch {
        setLoggedIn(false);
        setRole("");
      } finally {
        setChecking(false);
      }

      try {
        const response = await fetch("/api/items", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("Failed to load items");
        }

        setItems(data.items);
      } catch {
        setItemsError("Could not load items. Please refresh the page.");
      } finally {
        setItemsLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleLogout() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setLoggedIn(false);
        setRole("");
        router.refresh();
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch {
      alert("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    ...new Set(items.map((item) => item.category_name)),
  ].sort();

  const filteredItems = items.filter((item) => {
    const keyword = search.toLowerCase().trim();

    const matchesSearch =
      item.title.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword);

    const matchesType =
      typeFilter === "ALL" || item.item_type === typeFilter;

    const matchesCategory =
      categoryFilter === "ALL" ||
      item.category_name === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const lostCount = items.filter(
    (item) => item.item_type === "LOST"
  ).length;

  const foundCount = items.filter(
    (item) => item.item_type === "FOUND"
  ).length;

  return (
    <main className="pixel-grid min-h-screen bg-[#fff8e8] text-[#252a46]">
      <header className="border-b-[3px] border-[#252a46] bg-[#fffdf5]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center border-[3px] border-[#252a46] bg-[#ffab66] font-mono text-2xl font-black shadow-[3px_3px_0_#252a46]">
              ?
            </span>

            <div>
              <p className="pixel-title text-xl leading-tight">
                LOST & FOUND
              </p>
              <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#686b7e]">
                CAMPUS LOST & FOUND
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-3">
            {!checking &&
              (loggedIn ? (
                <>
                  <Link href="/matches" className="pixel-button text-xs">
                    MATCHES
                  </Link>

                  <Link href="/notifications" className="pixel-button text-xs">
                    ALERTS
                  </Link>

                  <Link href="/my-reports" className="pixel-button text-xs">
                    MY REPORTS
                  </Link>

                  {role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="pixel-button pixel-button-orange text-xs"
                    >
                      ADMIN
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="pixel-button pixel-button-pink text-xs"
                  >
                    {loading ? "WAIT..." : "LOGOUT"}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="pixel-button text-xs">
                    LOGIN
                  </Link>

                  <Link
                    href="/register"
                    className="pixel-button pixel-button-orange text-xs"
                  >
                    SIGN UP
                  </Link>
                </>
              ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="pixel-badge bg-[#a8d5a2]">
              CAMPUS LOST & FOUND SERVICES
            </span>

            <h1 className="pixel-title mt-8 text-5xl leading-[1.12] sm:text-6xl">
              LOST
              <span className="block text-[#e58b46]">
                SOMETHING?
              </span>
              LET&apos;S
              <span className="block text-[#548ac3]">
                FIND IT!
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-[#575c72]">
              Lost your wallet, keys, ID card, or something
              important? Report lost
              items, help others, and find matches with AI.
            </p>

            <div className="mt-9 flex flex-wrap gap-5">
              <Link
                href="/report-lost"
                className="pixel-button pixel-button-orange"
              >
                ✦ REPORT LOST
              </Link>

              <Link
                href="/report-found"
                className="pixel-button pixel-button-green"
              >
                ✦ REPORT FOUND
              </Link>
            </div>

            <p className="mt-8 font-mono text-xs font-bold tracking-widest text-[#75788c]">
              REPORT • SEARCH • RECONNECT
            </p>
          </div>

          <div className="pixel-card relative bg-[#b7dcf4] p-6 sm:p-10">
            <div className="absolute -right-3 -top-4 border-[3px] border-[#252a46] bg-[#ffab66] px-4 py-2 font-mono text-xs font-black shadow-[3px_3px_0_#252a46]">
              LOST & FOUND
            </div>

            <div className="mx-auto max-w-sm">
              <div className="mb-5 flex items-center justify-between font-mono text-xs font-black">
                <span>COMMONLY LOST ITEMS</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🔑", name: "KEYS", bg: "#fff8e8" },
                  { icon: "🎒", name: "BAG", bg: "#f4a8b8" },
                  { icon: "📱", name: "PHONE", bg: "#a8d5a2" },
                  { icon: "💳", name: "CARD", bg: "#ffab66" },
                  { icon: "🎧", name: "AUDIO", bg: "#fff8e8" },
                  { icon: "❔", name: "OTHER", bg: "#e1c6f3" },
                ].map((slot) => (
                  <div
                    key={slot.name}
                    className="flex aspect-square flex-col items-center justify-center gap-2 border-[3px] border-[#252a46] shadow-[3px_3px_0_#252a46]"
                    style={{ backgroundColor: slot.bg }}
                  >
                    <span className="text-3xl sm:text-4xl">
                      {slot.icon}
                    </span>
                    <span className="font-mono text-[10px] font-black">
                      {slot.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-7 border-[3px] border-[#252a46] bg-[#fff8e8] p-4">
                <p className="font-mono text-xs font-black">
                  OUR MISSION
                </p>
                <p className="mt-2 text-sm">
                  Reunite lost items with their owners!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-[3px] border-[#252a46] bg-[#252a46] px-5 py-7 text-[#fff8e8]">
        <div className="mx-auto grid max-w-7xl gap-6 text-center sm:grid-cols-3">
          <div>
            <p className="pixel-title text-3xl text-[#ffab66]">
              {itemsLoading ? "..." : items.length}
            </p>
            <p className="mt-2 font-mono text-xs font-bold">
              TOTAL REPORTS
            </p>
          </div>

          <div>
            <p className="pixel-title text-3xl text-[#f4a8b8]">
              {itemsLoading ? "..." : lostCount}
            </p>
            <p className="mt-2 font-mono text-xs font-bold">
              LOST ITEMS
            </p>
          </div>

          <div>
            <p className="pixel-title text-3xl text-[#a8d5a2]">
              {itemsLoading ? "..." : foundCount}
            </p>
            <p className="mt-2 font-mono text-xs font-bold">
              FOUND ITEMS
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="pixel-badge bg-[#ffab66]">
              ITEM REPORTS
            </span>

            <h2 className="pixel-title mt-5 text-3xl sm:text-4xl">
              BROWSE REPORTED ITEMS
            </h2>

            <p className="mt-3 text-[#575c72]">
              Search through reported items and discover
              what&apos;s been lost or found.
            </p>
          </div>

          <span className="font-mono text-xs font-black text-[#575c72]">
            {itemsLoading
              ? "LOADING..."
              : `${filteredItems.length} / ${items.length} ITEMS`}
          </span>
        </div>

        <div className="pixel-card mb-10 grid gap-4 bg-[#fffdf5] p-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block font-mono text-xs font-black">
              SEARCH ITEMS
            </label>
            <input
              type="text"
              placeholder="Find an item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pixel-input"
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs font-black">
              ITEM TYPE
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pixel-input"
            >
              <option value="ALL">ALL ITEMS</option>
              <option value="LOST">LOST ITEMS</option>
              <option value="FOUND">FOUND ITEMS</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs font-black">
              CATEGORY
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pixel-input"
            >
              <option value="ALL">ALL CATEGORIES</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {itemsLoading ? (
          <div className="pixel-card bg-white p-10 text-center font-mono font-bold">
            LOADING ITEMS...
          </div>
        ) : itemsError ? (
          <div className="pixel-card bg-[#f4a8b8] p-8 text-center font-bold">
            {itemsError}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="pixel-card bg-white p-10 text-center">
            <p className="text-4xl">📦</p>
            <p className="pixel-title mt-4 text-xl">
              NOTHING FOUND!
            </p>
            <p className="mt-3 text-[#575c72]">
              Try another search or change your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item.item_id}
                className="pixel-card flex h-full flex-col bg-[#fffdf5] p-6"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`pixel-badge ${
                      item.item_type === "LOST"
                        ? "bg-[#f4a8b8]"
                        : "bg-[#a8d5a2]"
                    }`}
                  >
                    {item.item_type === "LOST"
                      ? "✦ LOST"
                      : "★ FOUND"}
                  </span>

                  <span className="font-mono text-[11px] font-black text-[#575c72]">
                    {item.status}
                  </span>
                </div>

                <div className="mb-5 flex h-24 items-center justify-center border-[3px] border-[#252a46] bg-[#b7dcf4] text-5xl">
                  {getItemIcon(item)}
                </div>

                <h3 className="pixel-title mb-3 break-words text-lg">
                  {item.title}
                </h3>

                <p className="mb-6 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#575c72]">
                  {item.description}
                </p>

                <div className="space-y-3 border-t-[3px] border-dashed border-[#252a46] pt-5 text-sm">
                  <p>
                    <span className="font-mono font-black">
                      CATEGORY:
                    </span>{" "}
                    {item.category_name}
                  </p>

                  <p>
                    <span className="font-mono font-black">
                      LOCATION:
                    </span>{" "}
                    {item.location}
                  </p>

                  <p>
                    <span className="font-mono font-black">
                      DATE:
                    </span>{" "}
                    {String(item.date_found_lost).slice(0, 10)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t-[3px] border-[#252a46] bg-[#ffab66] px-5 py-7 text-center">
        <p className="pixel-title text-sm">
          CAMPUS LOST & FOUND
        </p>
        <p className="mt-2 font-mono text-xs font-bold">
          EVERY ITEM HAS A WAY BACK HOME
        </p>
      </footer>
    </main>
  );
}
