"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function reload() {
    const response = await fetch("/api/admin/claims", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load admin claims");
    setClaims(data.claims);
    setError("");
  }

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/admin/claims", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load admin claims");
        return data.claims;
      })
      .then((result) => {
        if (!controller.signal.aborted) {
          setClaims(result);
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

  async function review(claimId, decision) {
    if (!window.confirm(`${decision === "APPROVED" ? "Approve" : "Reject"} claim #${claimId}?`)) return;
    setBusyId(claimId);
    try {
      const response = await fetch("/api/admin/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review failed");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/" className="text-blue-700 underline">Home</Link>
        <h1 className="text-3xl font-bold">Admin — Claim Review</h1>
        <p className="text-gray-600">Review pending ownership claims. Only database users with ADMIN role can access this data or submit decisions.</p>
        {error && <p role="alert" className="rounded bg-red-100 p-3 text-red-700">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : claims.length === 0 ? (
          <p>No claims found.</p>
        ) : (
          claims.map((c) => (
            <section key={c.claim_id} className="space-y-2 rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="font-bold">Claim #{c.claim_id} · {c.status}</h2>
                <span className="text-sm text-gray-500">Match #{c.match_id} · score {Number(c.similarity_score).toFixed(3)}</span>
              </div>
              <p><strong>Lost:</strong> {c.lost_title}</p>
              <p><strong>Found:</strong> {c.found_title}</p>
              <p className="whitespace-pre-wrap"><strong>Explanation:</strong> {c.message}</p>
              <p className="text-sm text-gray-500">Claimant ID: {c.claimer_id}</p>
              {c.status === "PENDING" && (
                <div className="flex gap-3">
                  <button disabled={busyId !== null} onClick={() => review(c.claim_id, "APPROVED")} className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-40">Approve</button>
                  <button disabled={busyId !== null} onClick={() => review(c.claim_id, "REJECTED")} className="rounded bg-red-700 px-4 py-2 text-white disabled:opacity-40">Reject</button>
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
