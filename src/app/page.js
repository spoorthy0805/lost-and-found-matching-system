
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState(false);
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

        setLoggedIn(response.ok);
      } catch {
        setLoggedIn(false);
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

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-blue-700">
          Lost & Found Matching System
        </h1>

        <div className="flex items-center gap-3">
          {!checking &&
            (loggedIn ? (
              <>
                <Link
                  href="/my-reports"
                  className="rounded-lg border border-blue-700 px-5 py-2 font-semibold text-blue-700 hover:bg-blue-50"
                >
                  My Reports
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-blue-700 px-5 py-2 font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800"
                >
                  Register
                </Link>
              </>
            ))}
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="mb-5 text-4xl font-bold text-gray-900">
          Lost something? Let's find it.
        </h2>

        <p className="mb-10 text-lg text-gray-600">
          Report lost items, share found items, and help students
          reconnect with their belongings.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/report-lost"
            className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Report Lost Item
          </Link>

          <Link
            href="/report-found"
            className="rounded-lg border border-blue-700 px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
          >
            Report Found Item
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h3 className="mb-6 text-2xl font-bold text-gray-900">
          Browse Items
        </h3>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
          >
            <option value="ALL">All Items</option>
            <option value="LOST">Lost Items</option>
            <option value="FOUND">Found Items</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
          >
            <option value="ALL">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {!itemsLoading && !itemsError && (
          <p className="mb-5 text-sm text-gray-500">
            Showing {filteredItems.length} of {items.length} items
          </p>
        )}

        {itemsLoading ? (
          <p className="text-gray-500">Loading items...</p>
        ) : itemsError ? (
          <p className="text-red-600">{itemsError}</p>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            No matching items found.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredItems.map((item) => (
              <div
                key={item.item_id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
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

                <h4 className="mb-2 text-xl font-bold text-gray-900">
                  {item.title}
                </h4>

                <p className="mb-4 whitespace-pre-wrap break-words text-gray-600">
                  {item.description}
                </p>

                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Category:</strong> {item.category_name}
                  </p>

                  <p>
                    <strong>Location:</strong> {item.location}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {String(item.date_found_lost).slice(0, 10)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
