import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getPublicPoll,
  getPublicPollResults,
  submitPublicResponse,
  getOrCreateFingerprint,
  getVotedPolls,
  markPollVoted
} from "../lib/polls-api";
import { useAuth } from "../auth/AuthProvider";

const PollDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [poll, setPoll] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    // Check if this browser already voted (localStorage)
    const votedPolls = getVotedPolls();
    if (votedPolls.has(slug)) {
      setHasVoted(true);
    }

    getPublicPoll(slug)
      .then(async (res) => {
        setPoll(res.data);
        // Fetch results right away — show them after voting
        try {
          const rRes = await getPublicPollResults(slug);
          setResults(rRes.data);
        } catch {
          // results not yet available — ignore
        }
      })
      .catch((err) => setError(err.message || "Failed to load poll."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmitVote = async () => {
    if (!selectedOption || !poll || !slug) return;

    // Auth guard for AUTHENTICATED polls
    if (poll.responseMode === "AUTHENTICATED" && !isAuthenticated) {
      navigate(`/signin?redirect=/p/${slug}`);
      return;
    }

    setVoting(true);
    setVoteError("");

    try {
      const fingerprint = getOrCreateFingerprint();
      const isAnon = poll.responseMode === "ANONYMOUS";
      const answers = [{ questionId: poll.questions[0].id, optionId: selectedOption }];

      await submitPublicResponse(slug, answers, isAnon, fingerprint);

      // Mark voted in localStorage
      markPollVoted(slug);
      setHasVoted(true);

      // Refresh results
      try {
        const rRes = await getPublicPollResults(slug);
        setResults(rRes.data);
      } catch {
        // results fetch failed — still show voted state
      }
    } catch (err: any) {
      setVoteError(err.message || "Failed to submit vote.");
    } finally {
      setVoting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-brand-crimson border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading poll...</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="text-5xl">😕</div>
        <h2 className="text-2xl font-bold text-gray-900">Poll not found</h2>
        <p className="text-gray-500">{error || "This poll may have been removed or the link is incorrect."}</p>
        <Link to="/explorer" className="mt-2 text-brand-crimson font-bold text-sm hover:underline">
          Browse public polls →
        </Link>
      </div>
    );
  }

  const question = poll.questions[0];
  const isPollExpired = poll.isExpired || poll.isPublished;
  const requiresAuth = poll.responseMode === "AUTHENTICATED";

  const timeLeft = (() => {
    const ms = new Date(poll.expiresAt).getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) return `Voting ends in ${hours}h`;
    return `Voting ends in ${Math.floor(hours / 24)} days`;
  })();

  const avatarUrl =
    poll.creator?.image ??
    `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(poll.creator?.name ?? slug ?? "poll")}`;

  return (
    <div className="flex flex-col lg:flex-row w-full gap-16 text-gray-900 mt-4">
      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col gap-10 max-w-3xl">
        {/* Breadcrumb + meta */}
        <div className="flex flex-col gap-6 border-b border-gray-100 pb-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-500">
            <Link to="/explorer" className="hover:text-brand-crimson transition-colors">EXPLORER</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">ACTIVE POLL</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-brand-crimson">
            {isPollExpired ? (
              <span className="flex items-center gap-1.5 text-gray-400">× CLOSED</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-crimson animate-pulse" /> LIVE
              </span>
            )}
            {requiresAuth && (
              <span className="ml-3 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold tracking-wide">
                🔐 AUTH REQUIRED
              </span>
            )}
          </div>

          <div className="flex gap-5 items-start mt-1">
            <img src={avatarUrl} alt="Creator" className="w-14 h-14 bg-gray-100 rounded-full shrink-0 object-cover" />
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-crimson leading-tight">
                {poll.title}
              </h1>
              <p className="text-sm font-medium text-gray-500">
                Asked {poll.creator?.name ? `by ${poll.creator.name}` : "anonymously"} ·{" "}
                {new Date(poll.createdAt).toLocaleDateString()} ·{" "}
                <span className="font-bold text-gray-900">
                  {results?.overview?.totalResponses ?? 0} votes
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Auth wall */}
        {requiresAuth && !isAuthenticated && !isPollExpired && (
          <div className="flex flex-col items-center gap-4 p-8 border border-yellow-100 bg-yellow-50 rounded-lg text-center">
            <div className="text-4xl">🔐</div>
            <h3 className="text-lg font-bold text-gray-900">Sign in to vote</h3>
            <p className="text-sm text-gray-600">
              This poll requires you to be signed in. Your name will appear in the results.
            </p>
            <Link
              to={`/signin?redirect=/p/${slug}`}
              className="bg-brand-crimson text-white px-6 py-3 font-bold text-sm tracking-widest uppercase hover:bg-brand-crimson-hover transition-colors"
            >
              SIGN IN TO VOTE
            </Link>
          </div>
        )}

        {/* Voting Options */}
        {(!requiresAuth || isAuthenticated) && !isPollExpired && (
          <>
            <div className="flex flex-col gap-4">
              {question.options.map((option: any) => (
                <button
                  key={option.id}
                  onClick={() => !hasVoted && setSelectedOption(option.id)}
                  disabled={hasVoted}
                  className={`flex items-center gap-4 p-6 border transition-all text-left group ${
                    hasVoted && results
                      ? "cursor-default border-gray-100"
                      : selectedOption === option.id
                      ? "border-brand-crimson bg-red-50/20 text-brand-crimson"
                      : "border-red-100 text-gray-700 hover:border-brand-crimson/50 hover:bg-red-50/10"
                  }`}
                >
                  <div
                    className={`w-6 h-6 border flex items-center justify-center shrink-0 ${
                      selectedOption === option.id ? "border-brand-crimson" : "border-red-200"
                    }`}
                  >
                    {selectedOption === option.id && <div className="w-3 h-3 bg-brand-crimson" />}
                  </div>
                  <span className="text-lg font-bold">{option.label}</span>

                  {/* Show inline result bar if voted */}
                  {hasVoted && results && (() => {
                    const resultOption = results.questions[0]?.options?.find(
                      (o: any) => o.optionId === option.id
                    );
                    const pct = resultOption?.percentage ?? 0;
                    return (
                      <div className="flex-1 flex items-center gap-3 ml-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-crimson/60 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })()}
                </button>
              ))}
            </div>

            {!hasVoted && (
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-xs font-bold tracking-widest uppercase text-gray-400">{timeLeft}</span>
                <button
                  onClick={handleSubmitVote}
                  disabled={!selectedOption || voting}
                  className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-3.5 font-bold tracking-widest uppercase text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {voting ? "SUBMITTING..." : "SUBMIT VOTE"}
                  {!voting && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {voteError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{voteError}</div>
            )}

            {hasVoted && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-700">Your vote has been recorded!</p>
              </div>
            )}
          </>
        )}

        {/* Expired poll message */}
        {isPollExpired && (
          <div className="p-6 border border-gray-100 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500 font-medium">This poll is closed. View the final results on the right. →</p>
          </div>
        )}

        {/* Full results section (shown after voting OR if poll is closed) */}
        {(hasVoted || isPollExpired) && results && (
          <div className="flex flex-col gap-8 mt-2 pb-12">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-brand-crimson tracking-tight">Current Results</h2>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-500">LIVE STATISTICS</span>
            </div>

            <div className="flex flex-col gap-6">
              {results.questions[0].options.map((opt: any) => (
                <div key={opt.optionId} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-base font-bold text-gray-800">{opt.optionLabel}</span>
                    <span className="text-base font-bold text-brand-crimson">{opt.percentage}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-crimson/70 rounded-full transition-all duration-700"
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 pl-1">{opt.count} votes</p>
                </div>
              ))}
            </div>

            {/* Voter list for AUTHENTICATED polls */}
            {requiresAuth && results.voters && results.voters.length > 0 && (
              <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 tracking-wide">Voters</h3>
                <div className="flex flex-col gap-2">
                  {results.voters.map((voter: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <img
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(voter.name)}`}
                        alt={voter.name}
                        className="w-7 h-7 rounded-full bg-gray-100"
                      />
                      <span className="font-medium text-gray-800">{voter.name}</span>
                      <span className="text-gray-400 text-xs ml-auto">
                        {new Date(voter.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Right Sidebar ──────────────────────────────────────────── */}
      <aside className="w-full lg:w-80 flex flex-col gap-10 shrink-0">
        {/* Share */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold tracking-widest uppercase text-brand-crimson">SHARE</h3>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 bg-white border border-gray-200 border-r-0 p-3 text-sm text-gray-600 focus:outline-none rounded-l"
            />
            <button
              onClick={copyLink}
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white p-3 flex items-center justify-center transition-colors rounded-r"
            >
              {linkCopied ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
          {/* Social share buttons */}
          <div className="flex gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(poll.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 border border-red-100 flex items-center justify-center text-brand-crimson hover:bg-red-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
              </svg>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 border border-red-100 flex items-center justify-center text-brand-crimson hover:bg-red-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex flex-col gap-5 pt-8 border-t border-gray-100">
          <h3 className="text-xs font-bold tracking-widest uppercase text-brand-crimson mb-1">STATISTICS</h3>

          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-gray-600 font-medium">Total Votes</span>
            <span className="text-2xl font-bold text-brand-crimson">{results?.overview?.totalResponses ?? 0}</span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-gray-600 font-medium">Status</span>
            <span className={`text-sm font-bold ${isPollExpired ? "text-gray-400" : "text-green-600"}`}>
              {isPollExpired ? "Closed" : "Active"}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-gray-600 font-medium">Voting</span>
            <span className="text-sm font-bold text-gray-700">
              {requiresAuth ? "🔐 Auth required" : "👤 Open to all"}
            </span>
          </div>

          <div className="flex justify-between items-center pb-4">
            <span className="text-gray-600 font-medium">Visibility</span>
            <span className="text-sm font-bold text-gray-700">
              {poll.isPublic ? "🌍 Public" : "🔒 Private"}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default PollDetailsPage;
