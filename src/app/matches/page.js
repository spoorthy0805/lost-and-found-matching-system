
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
        headers: {
          "Content-Type": "application/json",
        },
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
            <span className="pixel-badge bg-[#a8d5a2]">
              AI-POWERED MATCHING
            </span>

            <h1 className="pixel-title mt-6 text-4xl sm:text-5xl">
              POTENTIAL MATCHES
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-[#575c72]">
              Our AI matching system compares lost and found
              item descriptions to identify potential matches
              related to your reports.
            </p>
          </div>

          <div className="pixel-card mb-10 flex flex-wrap items-center justify-between gap-4 bg-[#b7dcf4] p-5 sm:p-7">
            <div>
              <p className="font-mono text-xs font-black">
                MATCHING OVERVIEW
              </p>

              <p className="mt-2 text-sm text-[#575c72]">
                Review suggested matches and submit a claim
                when you recognize an item.
              </p>
            </div>

            <div className="border-[3px] border-[#252a46] bg-[#fff8e8] px-6 py-3 text-center shadow-[3px_3px_0_#252a46]">
              <p className="pixel-title text-3xl">
                {loading ? "..." : error ? "—" : matches.length}
              </p>

              <p className="mt-1 font-mono text-[10px] font-black">
                POTENTIAL MATCHES
              </p>
            </div>
          </div>

          {loading && (
            <div className="pixel-card bg-white p-10 text-center">
              <p className="pixel-title text-xl">
                LOADING MATCHES...
              </p>
              <p className="mt-3 text-sm text-[#575c72]">
                Retrieving your potential matches.
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="pixel-card bg-[#f4a8b8] p-8 text-center"
            >
              <p className="pixel-title text-xl">
                UNABLE TO LOAD MATCHES
              </p>
              <p className="mt-3 text-sm">
                {error}
              </p>
            </div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="pixel-card bg-[#fffdf5] p-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-[#252a46] bg-[#b7dcf4] text-4xl shadow-[4px_4px_0_#252a46]">
                🔎
              </div>

              <h2 className="pixel-title text-2xl">
                NO MATCHES YET
              </h2>

              <p className="mx-auto mt-4 max-w-md text-[#575c72]">
                No potential matches have been found for
                your reports yet. Check back later as new
                items are reported.
              </p>

              <Link
                href="/"
                className="pixel-button pixel-button-orange mt-7"
              >
                BROWSE REPORTED ITEMS →
              </Link>
            </div>
          )}

          {!loading && !error && matches.length > 0 && (
            <div className="space-y-9">
              {matches.map((match) => (
                <article
                  key={match.match_id}
                  className="pixel-card bg-[#fffdf5] p-5 sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5 border-b-[3px] border-dashed border-[#252a46] pb-6">
                    <div className="min-w-0 flex-1">
                      <span className="pixel-badge bg-[#b7dcf4]">
                        AI MATCH RESULT
                      </span>

                      <h2 className="pixel-title mt-4 break-words text-xl sm:text-2xl">
                        {match.lost_title}
                        <span className="mx-3 text-[#548ac3]">
                          ↔
                        </span>
                        {match.found_title}
                      </h2>
                    </div>

                    <div className="shrink-0 border-[3px] border-[#252a46] bg-[#a8d5a2] px-5 py-3 text-center shadow-[4px_4px_0_#252a46]">
                      <p className="pixel-title text-2xl sm:text-3xl">
                        {(Number(match.similarity_score) * 100).toFixed(1)}%
                      </p>

                      <p className="mt-1 font-mono text-[10px] font-black">
                        AI SIMILARITY
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-6 md:grid-cols-2">
                    <div className="border-[3px] border-[#252a46] bg-[#fce1e7] p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center border-[3px] border-[#252a46] bg-[#f4a8b8] text-2xl">
                          🔎
                        </span>

                        <div>
                          <span className="pixel-badge bg-[#f4a8b8]">
                            LOST ITEM
                          </span>

                          <h3 className="pixel-title mt-2 break-words text-lg">
                            {match.lost_title}
                          </h3>
                        </div>
                      </div>

                      <p className="font-mono text-xs font-black">
                        DESCRIPTION
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#575c72]">
                        {match.lost_description}
                      </p>

                      <div className="mt-5 border-t-2 border-dashed border-[#252a46] pt-4">
                        <p className="font-mono text-xs font-black">
                          LAST SEEN LOCATION
                        </p>

                        <p className="mt-2 break-words text-sm">
                          {match.lost_location}
                        </p>
                      </div>
                    </div>

                    <div className="border-[3px] border-[#252a46] bg-[#e2f0df] p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center border-[3px] border-[#252a46] bg-[#a8d5a2] text-2xl">
                          📦
                        </span>

                        <div>
                          <span className="pixel-badge bg-[#a8d5a2]">
                            FOUND ITEM
                          </span>

                          <h3 className="pixel-title mt-2 break-words text-lg">
                            {match.found_title}
                          </h3>
                        </div>
                      </div>

                      <p className="font-mono text-xs font-black">
                        DESCRIPTION
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#575c72]">
                        {match.found_description}
                      </p>

                      <div className="mt-5 border-t-2 border-dashed border-[#252a46] pt-4">
                        <p className="font-mono text-xs font-black">
                          FOUND LOCATION
                        </p>

                        <p className="mt-2 break-words text-sm">
                          {match.found_location}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-[3px] border-[#252a46] bg-[#b7dcf4] p-4">
                    <div>
                      <p className="font-mono text-xs font-black">
                        MATCH STATUS
                      </p>

                      <span className="pixel-badge mt-2 bg-[#fff8e8]">
                        {match.status}
                      </span>
                    </div>

                    <p className="max-w-sm text-sm leading-6 text-[#575c72]">
                      AI similarity indicates how closely
                      item descriptions match. It does not
                      confirm ownership.
                    </p>
                  </div>

                  {match.can_claim && match.status === "PENDING" && (
                    <div className="mt-7 border-t-[3px] border-dashed border-[#252a46] pt-7">
                      <h3 className="pixel-title text-xl">
                        ITEM CLAIM
                      </h3>

                      {match.my_claim_status ? (
                        <div className="mt-5 border-[3px] border-[#252a46] bg-[#a8d5a2] p-4">
                          <p className="font-mono text-xs font-black">
                            YOUR CLAIM STATUS
                          </p>

                          <p className="mt-2 font-semibold">
                            {match.my_claim_status}
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="mt-3 text-sm text-[#575c72]">
                            If you believe this item belongs
                            to you, provide identifying
                            details to support your claim.
                          </p>

                          <label
                            htmlFor={`claim-${match.match_id}`}
                            className="mb-2 mt-5 block font-mono text-xs font-black"
                          >
                            CLAIM DETAILS
                          </label>

                          <textarea
                            id={`claim-${match.match_id}`}
                            maxLength={1000}
                            rows={4}
                            value={messages[match.match_id] || ""}
                            onChange={(event) =>
                              setMessages((prev) => ({
                                ...prev,
                                [match.match_id]: event.target.value,
                              }))
                            }
                            className="pixel-input resize-y"
                            placeholder="Describe identifying details that can help verify your ownership..."
                          />

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                            <span className="font-mono text-xs text-[#575c72]">
                              {(messages[match.match_id] || "").length}/1000
                              {" "}CHARACTERS
                            </span>

                            <button
                              type="button"
                              disabled={submitting === match.match_id}
                              onClick={() => submitClaim(match.match_id)}
                              className="pixel-button pixel-button-orange"
                            >
                              {submitting === match.match_id
                                ? "SUBMITTING..."
                                : "SUBMIT CLAIM →"}
                            </button>
                          </div>
                        </>
                      )}

                      {results[match.match_id] && (
                        <div
                          role="status"
                          className="mt-5 border-[3px] border-[#252a46] bg-[#fff8e8] p-4 text-sm font-semibold"
                        >
                          {results[match.match_id]}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
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
