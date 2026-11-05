
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  async function loadClaims() {
    try {
      const response = await fetch("/api/admin/claims", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setError("Access denied. This page is for admins only.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load claims.");
      }

      setClaims(data.claims || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaims();
  }, []);

  async function reviewClaim(claimId, decision) {
    const confirmed = window.confirm(
      `Are you sure you want to ${decision.toLowerCase()} this claim?`
    );

    if (!confirmed) return;

    setBusyId(claimId);
    setNotice("");

    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not review claim.");
      }

      setNotice(data.message);
      await loadClaims();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-blue-700">
          ← Back to Home
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Review student claims and manage ownership requests.
        </p>

        {loading && <p className="mt-8">Loading claims...</p>}

        {error && (
          <p className="mt-8 font-medium text-red-600">{error}</p>
        )}

        {notice && (
          <p className="mt-6 font-medium text-blue-700">{notice}</p>
        )}

        {!loading && !error && claims.length === 0 && (
          <p className="mt-8 text-gray-600">No claims found.</p>
        )}

        <div className="mt-8 space-y-5">
          {claims.map((claim) => (
            <div
              key={claim.claim_id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Claim #{claim.claim_id}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    claim.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : claim.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {claim.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-gray-700">
                <p>
                  <strong>Student:</strong> {claim.claimer_name}
                </p>
                <p>
                  <strong>Email:</strong> {claim.claimer_email}
                </p>
                <p>
                  <strong>Lost Item:</strong> {claim.lost_title}
                </p>
                <p>
                  <strong>Found Item:</strong> {claim.found_title}
                </p>
                <p>
                  <strong>AI Similarity:</strong>{" "}
                  {(Number(claim.similarity_score) * 100).toFixed(1)}%
                </p>
                <p>
                  <strong>Claim Message:</strong> {claim.message}
                </p>
              </div>

              {claim.status === "PENDING" && (
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() =>
                      reviewClaim(claim.claim_id, "APPROVED")
                    }
                    className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() =>
                      reviewClaim(claim.claim_id, "REJECTED")
                    }
                    className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
