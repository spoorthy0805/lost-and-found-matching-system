
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState({});
  const [results, setResults] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch("/api/matches", {
          cache: "no-store",
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load matches.");
        }

        setMatches(data.matches || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [router]);

  async function submitClaim(matchId) {
    const message = (messages[matchId] || "").trim();

    if (!message) {
      setResults((prev) => ({
        ...prev,
        [matchId]: "Please enter a claim message.",
      }));
      return;
    }

    setSubmitting(matchId);

    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          message,
        }),
      });

      const data = await response.json();

      setResults((prev) => ({
        ...prev,
        [matchId]: data.message || "Something went wrong.",
      }));

      if (response.ok) {
        setMatches((prev) =>
          prev.map((match) =>
            match.match_id === matchId
              ? { ...match, my_claim_status: "PENDING" }
              : match
          )
        );
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [matchId]: "Could not submit claim.",
      }));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-blue-600">
          ← Back to Home
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Potential Matches
        </h1>

        <p className="mt-2 text-gray-600">
          AI-suggested matches related to your reported items.
        </p>

        {loading && <p className="mt-8">Loading matches...</p>}
        {error && <p className="mt-8 text-red-600">{error}</p>}

        {!loading && !error && matches.length === 0 && (
          <p className="mt-8 text-gray-600">
            No potential matches found for your reports yet.
          </p>
        )}

        <div className="mt-8 space-y-5">
          {matches.map((match) => (
            <div
              key={match.match_id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {match.lost_title} ↔ {match.found_title}
                </h2>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {(Number(match.similarity_score) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-gray-800">Lost Item</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {match.lost_description}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Location: {match.lost_location}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800">Found Item</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {match.found_description}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Location: {match.found_location}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Status: {match.status} · Similarity is not proof of ownership.
              </p>

              {match.can_claim && match.status === "PENDING" && (
                <div className="mt-5 border-t border-gray-200 pt-5">
                  {match.my_claim_status ? (
                    <p className="text-sm font-medium text-green-700">
                      Your claim: {match.my_claim_status}
                    </p>
                  ) : (
                    <>
                      <label
                        htmlFor={`claim-${match.match_id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Why do you believe this item belongs to you?
                      </label>
                      <textarea
                        id={`claim-${match.match_id}`}
                        maxLength={1000}
                        rows={3}
                        value={messages[match.match_id] || ""}
                        onChange={(event) =>
                          setMessages((prev) => ({
                            ...prev,
                            [match.match_id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                        placeholder="Describe identifying details..."
                      />
                      <button
                        type="button"
                        disabled={submitting === match.match_id}
                        onClick={() => submitClaim(match.match_id)}
                        className="mt-3 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-50"
                      >
                        {submitting === match.match_id
                          ? "Submitting..."
                          : "Submit Claim"}
                      </button>
                    </>
                  )}

                  {results[match.match_id] && (
                    <p className="mt-3 text-sm text-gray-700">
                      {results[match.match_id]}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
