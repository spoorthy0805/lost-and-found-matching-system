
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
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function load() {
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

    load();
  }, [router]);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not review claim.");
      }

      setNotice(data.message || "Claim reviewed successfully.");
      await loadClaims();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = claims.filter(
    (claim) => claim.status === "PENDING"
  ).length;

  const approvedCount = claims.filter(
    (claim) => claim.status === "APPROVED"
  ).length;

  const rejectedCount = claims.filter(
    (claim) => claim.status === "REJECTED"
  ).length;

  const filteredClaims = claims.filter(
    (claim) => filter === "ALL" || claim.status === filter
  );

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
              ADMINISTRATION
            </span>

            <h1 className="pixel-title mt-6 text-4xl sm:text-5xl">
              ADMIN DASHBOARD
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[#575c72]">
              Review ownership claims submitted through
              the Lost & Found system and manage claim decisions.
            </p>
          </div>

          <div className="mb-10 grid gap-5 sm:grid-cols-4">
            <div className="pixel-card bg-[#b7dcf4] p-5 text-center">
              <p className="pixel-title text-3xl">
                {loading ? "..." : claims.length}
              </p>
              <p className="mt-2 font-mono text-xs font-black">
                TOTAL CLAIMS
              </p>
            </div>

            <div className="pixel-card bg-[#ffdfad] p-5 text-center">
              <p className="pixel-title text-3xl">
                {loading ? "..." : pendingCount}
              </p>
              <p className="mt-2 font-mono text-xs font-black">
                PENDING
              </p>
            </div>

            <div className="pixel-card bg-[#a8d5a2] p-5 text-center">
              <p className="pixel-title text-3xl">
                {loading ? "..." : approvedCount}
              </p>
              <p className="mt-2 font-mono text-xs font-black">
                APPROVED
              </p>
            </div>

            <div className="pixel-card bg-[#f4a8b8] p-5 text-center">
              <p className="pixel-title text-3xl">
                {loading ? "..." : rejectedCount}
              </p>
              <p className="mt-2 font-mono text-xs font-black">
                REJECTED
              </p>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="pixel-title text-xl">
                CLAIM MANAGEMENT
              </h2>

              <p className="mt-2 text-sm text-[#575c72]">
                Review claim details before making a decision.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    aria-pressed={filter === option}
                    className={`border-[3px] border-[#252a46] px-3 py-2 font-mono text-xs font-black transition-colors ${
                      filter === option
                        ? "bg-[#ffab66]"
                        : "bg-white hover:bg-[#b7dcf4]"
                    }`}
                  >
                    {option}
                  </button>
                )
              )}
            </div>
          </div>

          {notice && (
            <div
              role="status"
              className="mb-7 border-[3px] border-[#252a46] bg-[#b7dcf4] p-5 text-sm font-semibold"
            >
              {notice}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-7 border-[3px] border-[#252a46] bg-[#f4a8b8] p-5"
            >
              <p className="font-mono text-xs font-black">
                UNABLE TO LOAD CLAIMS
              </p>

              <p className="mt-2 text-sm">
                {error}
              </p>
            </div>
          )}

          {loading && (
            <div className="pixel-card bg-white p-10 text-center">
              <p className="pixel-title text-xl">
                LOADING CLAIMS...
              </p>
            </div>
          )}

          {!loading && !error && claims.length === 0 && (
            <div className="pixel-card bg-[#fffdf5] p-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-[#252a46] bg-[#b7dcf4] text-4xl shadow-[4px_4px_0_#252a46]">
                📋
              </div>

              <h2 className="pixel-title text-2xl">
                NO CLAIMS YET
              </h2>

              <p className="mt-4 text-[#575c72]">
                Ownership claims submitted by users will
                appear here for review.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            claims.length > 0 &&
            filteredClaims.length === 0 && (
              <div className="pixel-card bg-[#fffdf5] p-10 text-center">
                <h2 className="pixel-title text-xl">
                  NO {filter} CLAIMS
                </h2>

                <p className="mt-3 text-sm text-[#575c72]">
                  There are no claims matching this filter.
                </p>
              </div>
            )}

          {!loading && !error && filteredClaims.length > 0 && (
            <div className="space-y-7">
              {filteredClaims.map((claim) => {
                const isPending = claim.status === "PENDING";

                const statusColor =
                  claim.status === "APPROVED"
                    ? "bg-[#a8d5a2]"
                    : claim.status === "REJECTED"
                    ? "bg-[#f4a8b8]"
                    : "bg-[#ffdfad]";

                return (
                  <article
                    key={claim.claim_id}
                    className="pixel-card bg-[#fffdf5] p-5 sm:p-8"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b-[3px] border-dashed border-[#252a46] pb-5">
                      <div className="min-w-0 flex-1">
                        <span className={`pixel-badge ${statusColor}`}>
                          {claim.status}
                        </span>

                        <h3 className="pixel-title mt-4 text-xl">
                          CLAIM #{claim.claim_id}
                        </h3>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center border-[3px] border-[#252a46] bg-[#b7dcf4] text-2xl shadow-[3px_3px_0_#252a46]">
                        📋
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div className="border-[3px] border-[#252a46] bg-[#fce1e7] p-5">
                        <p className="font-mono text-xs font-black">
                          LOST ITEM
                        </p>

                        <p className="mt-3 break-words font-semibold">
                          {claim.lost_title || "Not available"}
                        </p>
                      </div>

                      <div className="border-[3px] border-[#252a46] bg-[#e2f0df] p-5">
                        <p className="font-mono text-xs font-black">
                          FOUND ITEM
                        </p>

                        <p className="mt-3 break-words font-semibold">
                          {claim.found_title || "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-[3px] border-[#252a46] bg-[#fff8e8] p-5">
                      <p className="font-mono text-xs font-black">
                        CLAIM MESSAGE
                      </p>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#575c72]">
                        {claim.message || "No message provided."}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-5 border-[3px] border-[#252a46] bg-[#b7dcf4] p-5">
                      {claim.claimant_name && (
                        <div>
                          <p className="font-mono text-xs font-black">
                            CLAIMED BY
                          </p>
                          <p className="mt-2 text-sm">
                            {claim.claimant_name}
                          </p>
                        </div>
                      )}

                      {claim.created_at && (
                        <div>
                          <p className="font-mono text-xs font-black">
                            SUBMITTED ON
                          </p>
                          <p className="mt-2 text-sm">
                            {formatDate(claim.created_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="mt-7 flex flex-wrap gap-4 border-t-[3px] border-dashed border-[#252a46] pt-6">
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            reviewClaim(claim.claim_id, "APPROVED")
                          }
                          className="pixel-button pixel-button-green"
                        >
                          {busyId === claim.claim_id
                            ? "PROCESSING..."
                            : "APPROVE CLAIM"}
                        </button>

                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            reviewClaim(claim.claim_id, "REJECTED")
                          }
                          className="pixel-button pixel-button-pink"
                        >
                          {busyId === claim.claim_id
                            ? "PROCESSING..."
                            : "REJECT CLAIM"}
                        </button>
                      </div>
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
