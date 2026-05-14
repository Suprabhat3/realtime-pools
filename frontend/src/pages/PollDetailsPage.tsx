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

// ─── Helper: resolve avatar URL ──────────────────────────────────────────────

const resolveAvatar = (name: string | null, image: string | null, isAnonymous: boolean): string => {
  if (!isAnonymous && image) return image;
  if (!isAnonymous && name) {
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;
  }
  // Generic ghost avatar for anonymous voters
  return `https://api.dicebear.com/7.x/shapes/svg?seed=anon&backgroundColor=e2e8f0`;
};

// ─── Demographic Helpers ──────────────────────────────────────────────────────

const genderLabel: Record<string, { color: string; text: string }> = {
  MALE:             { color: "text-blue-500",   text: "Male" },
  FEMALE:           { color: "text-pink-500",   text: "Female" },
  NON_BINARY:       { color: "text-purple-500", text: "Non-binary" },
  PREFER_NOT_TO_SAY:{ color: "text-gray-400",   text: "Prefer not to say" }
};

const GENDER_COLORS = ["text-blue-500", "text-pink-500", "text-purple-500", "text-gray-400"];
const AGE_COLORS    = ["text-teal-500", "text-cyan-500", "text-sky-500", "text-indigo-500", "text-violet-500", "text-fuchsia-500"];

const DemoBar = ({ label, count, percentage, color }: { label: string; count: number; percentage: number; color: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-600 font-medium truncate max-w-[120px]">{label}</span>
      <span className={`font-bold tabular-nums ${color}`}>{percentage}%</span>
    </div>
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
    <span className="text-[10px] text-gray-400 tabular-nums">{count} voter{count !== 1 ? "s" : ""}</span>
  </div>
);

// ─── Sub-component: Voter Avatar Stack ───────────────────────────────────────

interface VoterPreview {
  name: string | null;
  image: string | null;
  isAnonymous: boolean;
}

const AvatarStack = ({
  voters,
  totalCount,
  isAnonymousMode
}: {
  voters: VoterPreview[];
  totalCount: number;
  isAnonymousMode: boolean;
}) => {
  if (totalCount === 0) return null;

  // For fully anonymous polls, just show the count number
  if (isAnonymousMode) {
    return (
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 border border-gray-200">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <span className="text-xs font-bold text-gray-500">{totalCount}</span>
      </div>
    );
  }

  // Authenticated mode: show real avatar stack
  const displayVoters = voters.slice(0, 5);
  const overflow = totalCount - displayVoters.length;

  return (
    <div className="flex items-center gap-2.5 ml-auto shrink-0">
      <div className="flex -space-x-2.5 hover:space-x-1 transition-all duration-300">
        {displayVoters.map((v, i) => (
          <img
            key={i}
            src={resolveAvatar(v.name, v.image, v.isAnonymous)}
            alt={v.name ?? "Voter"}
            title={v.isAnonymous ? "Anonymous voter" : (v.name ?? "Voter")}
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover bg-gray-50 shrink-0 hover:scale-110 transition-transform hover:z-50 relative"
            style={{ zIndex: displayVoters.length - i }}
          />
        ))}
        {overflow > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shadow-sm shrink-0 hover:scale-110 transition-transform relative z-0"
          >
            <span className="text-[10px] font-extrabold text-gray-500">+{overflow}</span>
          </div>
        )}
      </div>
      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">{totalCount} votes</span>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PollDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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
  const isPollExpired = !!poll.isExpired;
  const requiresAuth = poll.responseMode === "AUTHENTICATED";
  const isAnonymousPoll = poll.responseMode === "ANONYMOUS";

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

  // Helper to get results option data by id
  const getResultOption = (optionId: string) =>
    results?.questions?.[0]?.options?.find((o: any) => o.optionId === optionId);

  return (
    <div className="flex flex-col lg:flex-row w-full gap-12 lg:gap-16 text-gray-900 mt-6 md:mt-10 mb-20">
      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col gap-8 max-w-3xl">
        {/* Breadcrumb + meta */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-gray-400">
              <Link to="/explorer" className="hover:text-brand-crimson transition-colors">EXPLORER</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">ACTIVE POLL</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-brand-crimson">
                {isPollExpired ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full">
                    <span className="text-lg leading-none mb-0.5">×</span> CLOSED
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1 bg-brand-crimson/10 rounded-full border border-brand-crimson/20">
                    <div className="w-2 h-2 rounded-full bg-brand-crimson animate-pulse" /> LIVE
                  </span>
                )}
              </div>
              {requiresAuth && (
                <span className="px-3 py-1 bg-brand-cream/50 border border-red-100 text-brand-crimson rounded-full text-[10px] sm:text-xs font-bold tracking-wide uppercase shadow-sm hidden sm:inline-block">
                  🔐 AUTH REQUIRED
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-5 sm:gap-6 items-start mt-2 bg-white border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-sm">
            <img src={avatarUrl} alt="Creator" className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border-2 border-white shadow-md rounded-full shrink-0 object-cover" />
            <div className="flex flex-col gap-3 sm:gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
                {poll.title}
              </h1>
              <p className="text-sm font-medium text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Asked {poll.creator?.name ? `by ` : "anonymously"}</span>
                {poll.creator?.name && <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">{poll.creator.name}</span>}
                <span className="text-gray-300">•</span>
                <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                <span className="text-gray-300">•</span>
                <span className="font-bold text-brand-crimson bg-brand-crimson/5 px-2 py-0.5 rounded-full border border-brand-crimson/10">
                  {results?.overview?.totalResponses ?? 0} votes
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Auth wall */}
        {requiresAuth && !isAuthenticated && !isPollExpired && (
          <div className="flex flex-col items-center gap-5 p-10 border-2 border-yellow-100 bg-yellow-50/50 rounded-3xl text-center shadow-sm">
            <div className="w-16 h-16 bg-white border border-yellow-200 rounded-2xl flex items-center justify-center text-3xl shadow-sm">🔐</div>
            <h3 className="text-2xl font-bold text-gray-900">Sign in to vote</h3>
            <p className="text-base text-gray-600 max-w-md leading-relaxed">
              This poll requires you to be signed in. Your name will appear in the results to ensure accountability.
            </p>
            <Link
              to={`/signin?redirect=/p/${slug}`}
              className="mt-2 bg-brand-crimson text-white px-8 py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-brand-crimson-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-crimson/20 transition-all duration-300"
            >
              SIGN IN TO VOTE
            </Link>
          </div>
        )}

        {/* Voting Options */}
        {(!requiresAuth || isAuthenticated) && !isPollExpired && (
          <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              {question.options.map((option: any) => {
                const resultOption = getResultOption(option.id);
                const pct = resultOption?.percentage ?? 0;
                const count = resultOption?.count ?? 0;
                const voterPreviews: VoterPreview[] = resultOption?.voterPreviews ?? [];
                const isSelected = selectedOption === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => !hasVoted && setSelectedOption(option.id)}
                    disabled={hasVoted}
                    className={`flex flex-col gap-4 p-5 sm:p-6 border-2 transition-all duration-300 text-left group rounded-2xl ${
                      hasVoted && results
                        ? "cursor-default border-gray-100 bg-gray-50/50"
                        : isSelected
                        ? "border-brand-crimson bg-brand-crimson/5 text-brand-crimson shadow-md shadow-brand-crimson/10 -translate-y-0.5"
                        : "border-gray-100 text-gray-700 hover:border-brand-crimson/30 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-sm"
                    }`}
                  >
                    {/* Top row: checkbox + label + avatar stack */}
                    <div className="flex items-center gap-4 w-full">
                      {!hasVoted && (
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "border-brand-crimson bg-brand-crimson" : "border-gray-300 bg-white group-hover:border-brand-crimson/50"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      )}
                      <span className={`text-lg sm:text-xl font-bold flex-1 ${isSelected ? "text-brand-crimson" : "text-gray-900"}`}>{option.label}</span>

                      {/* Avatar stack — always show after voting */}
                      {hasVoted && results && (
                        <AvatarStack
                          voters={voterPreviews}
                          totalCount={count}
                          isAnonymousMode={isAnonymousPoll}
                        />
                      )}
                    </div>

                    {/* Progress bar — shown after voting */}
                    {hasVoted && results && (
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-brand-crimson rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${pct}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-brand-crimson w-12 text-right tabular-nums bg-brand-crimson/10 px-2 py-1 rounded-md">
                          {pct}%
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!hasVoted && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="text-xs font-bold tracking-widest uppercase text-gray-500">{timeLeft}</span>
                </div>
                <button
                  onClick={handleSubmitVote}
                  disabled={!selectedOption || voting}
                  className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-4 rounded-xl font-bold tracking-widest uppercase text-sm shadow-md shadow-brand-crimson/20 hover:shadow-lg hover:shadow-brand-crimson/30 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none w-full sm:w-auto"
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
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {voteError}
              </div>
            )}

            {hasVoted && (
              <div className="flex items-center gap-4 p-5 bg-green-50/80 border border-green-200/60 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-green-500/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <p className="text-base font-bold text-green-800">Your vote has been recorded!</p>
                  <p className="text-sm text-green-700/80">Thank you for participating in this poll.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expired poll message */}
        {isPollExpired && (
          <div className="p-8 border-2 border-gray-100 bg-gray-50/50 rounded-3xl text-center flex flex-col items-center gap-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <p className="text-gray-900 font-bold text-lg">This poll is closed</p>
            <p className="text-gray-500 text-sm">Voting has ended. You can view the final results below.</p>
          </div>
        )}

        {/* Full results section for Closed or Already Voted */}
        {((hasVoted && results) || (isPollExpired && results)) && (
          <div className="flex flex-col gap-6 mt-4 pb-12">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-crimson/10 flex items-center justify-center text-brand-crimson">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Final Results</h2>
            </div>

            {poll?.isAnnounced && !results?.overview?.hasSufficientDemoData && (
              <div className="flex items-start gap-3 p-4 mb-2 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm font-bold text-amber-800">Demographic data hidden</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    At least 3 authenticated voters are needed to display demographic breakdowns. 
                    Currently not enough data to protect voter privacy.
                  </p>
                </div>
              </div>
            )}

            {(isPollExpired || poll?.isAnnounced) && (
              <div className="flex flex-col gap-4">
                {results.questions[0].options.map((opt: any) => (
                  <div key={opt.optionId} className="flex flex-col gap-3 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">{opt.optionLabel}</span>
                      <span className="text-lg font-extrabold text-brand-crimson tabular-nums bg-brand-crimson/10 px-3 py-1 rounded-lg">{opt.percentage}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-brand-crimson rounded-full transition-all duration-1000"
                        style={{ width: `${opt.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                      <p className="text-sm font-medium text-gray-400">{opt.count} vote{opt.count !== 1 ? "s" : ""}</p>
                      <AvatarStack
                        voters={opt.voterPreviews ?? []}
                        totalCount={opt.count}
                        isAnonymousMode={isAnonymousPoll}
                      />
                    </div>
                    {/* Demographics */}
                    {opt.demographics && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 mt-2 border-t border-gray-100">
                        {opt.demographics.gender?.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <p className="text-xs font-bold tracking-widest uppercase text-gray-400">By Gender</p>
                            <div className="flex flex-col gap-3">
                              {opt.demographics.gender.map((slice: any, idx: number) => {
                                const meta = genderLabel[slice.label];
                                return (
                                  <DemoBar
                                    key={slice.label}
                                    label={meta?.text ?? slice.label}
                                    count={slice.count}
                                    percentage={slice.percentage}
                                    color={GENDER_COLORS[idx % GENDER_COLORS.length]}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {opt.demographics.ageGroups?.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <p className="text-xs font-bold tracking-widest uppercase text-gray-400">By Age Group</p>
                            <div className="flex flex-col gap-3">
                              {opt.demographics.ageGroups.map((slice: any, idx: number) => (
                                <DemoBar
                                  key={slice.label}
                                  label={slice.label}
                                  count={slice.count}
                                  percentage={slice.percentage}
                                  color={AGE_COLORS[idx % AGE_COLORS.length]}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {opt.demographics.gender?.length === 0 && opt.demographics.ageGroups?.length === 0 && (
                          <p className="text-xs text-gray-400 col-span-2">No demographic data available for this option.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Voter list for AUTHENTICATED polls */}
            {requiresAuth && results.voters && results.voters.length > 0 && (
              <div className="flex flex-col gap-4 pt-6">
                <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Public Voter Record
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.voters.map((voter: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 text-sm p-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl shadow-sm transition-colors group">
                      <img
                        src={resolveAvatar(voter.name, voter.image, false)}
                        alt={voter.name}
                        className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50 object-cover shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-gray-900 truncate">{voter.name}</span>
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">
                          {new Date(voter.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Right Sidebar ──────────────────────────────────────────── */}
      <aside className="w-full lg:w-80 flex flex-col gap-8 shrink-0">
        {/* Share Card */}
        <div className="flex flex-col gap-5 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-brand-crimson">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <h3 className="text-sm font-extrabold tracking-wide text-gray-900">Share Poll</h3>
          </div>
          
          <div className="flex shadow-sm rounded-xl overflow-hidden border border-gray-200 focus-within:border-brand-crimson focus-within:ring-1 focus-within:ring-brand-crimson/20 transition-all">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 bg-gray-50/50 p-3 text-sm text-gray-600 focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-4 flex items-center justify-center transition-colors border-l border-brand-crimson"
            >
              {linkCopied ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider">Copy</span>
              )}
            </button>
          </div>

          <div className="flex gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(poll.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#000000] hover:bg-gray-800 text-white p-3 rounded-xl transition-colors shadow-sm text-sm font-bold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Post
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white p-3 rounded-xl transition-colors shadow-sm text-sm font-bold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Share
            </a>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="flex flex-col bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <h3 className="text-sm font-extrabold tracking-wide text-gray-900">Poll Details</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Votes</span>
              <span className="text-xl font-extrabold text-brand-crimson tabular-nums">{results?.overview?.totalResponses ?? 0}</span>
            </div>

            <div className="flex justify-between items-center px-2 py-1">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPollExpired ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
                {isPollExpired ? "Closed" : "Active"}
              </span>
            </div>

            <div className="flex justify-between items-center px-2 py-1 border-t border-gray-50 pt-3">
              <span className="text-sm font-medium text-gray-600">Authentication</span>
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                {requiresAuth ? "🔐 Required" : "👤 Anonymous"}
              </span>
            </div>

            <div className="flex justify-between items-center px-2 py-1 border-t border-gray-50 pt-3">
              <span className="text-sm font-medium text-gray-600">Visibility</span>
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                {poll.isPublic ? "🌍 Public feed" : "🔒 Link only"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default PollDetailsPage;
