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

const resolveAvatar = (name: string | null, image: string | null, isAnonymous: boolean): string => {
  if (!isAnonymous && image) return image;
  if (!isAnonymous && name) {
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;
  }
  return `https://api.dicebear.com/7.x/shapes/svg?seed=anon&backgroundColor=e2e8f0`;
};

const genderLabel: Record<string, { color: string; text: string }> = {
  MALE: { color: "text-blue-500", text: "Male" },
  FEMALE: { color: "text-pink-500", text: "Female" },
  NON_BINARY: { color: "text-purple-500", text: "Non-binary" },
  PREFER_NOT_TO_SAY: { color: "text-gray-400", text: "Prefer not to say" }
};

const GENDER_COLORS = ["text-blue-500", "text-pink-500", "text-purple-500", "text-gray-400"];
const AGE_COLORS = ["text-teal-500", "text-cyan-500", "text-sky-500", "text-indigo-500", "text-violet-500", "text-fuchsia-500"];

const DemoBar = ({ label, count, percentage, color }: { label: string; count: number; percentage: number; color: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-600 font-medium truncate max-w-[120px]">{label}</span>
      <span className={`font-bold tabular-nums ${color}`}>{percentage}%</span>
    </div>
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`} style={{ width: `${percentage}%` }} />
    </div>
    <span className="text-[10px] text-gray-400 tabular-nums">{count} voter{count !== 1 ? "s" : ""}</span>
  </div>
);

interface VoterPreview {
  name: string | null;
  image: string | null;
  isAnonymous: boolean;
}

const AvatarStack = ({ voters, totalCount, isAnonymousMode }: { voters: VoterPreview[]; totalCount: number; isAnonymousMode: boolean }) => {
  if (totalCount === 0) return null;

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

  const displayVoters = voters.slice(0, 5);
  const overflow = totalCount - displayVoters.length;

  return (
    <div className="flex items-center gap-2.5 ml-auto shrink-0">
      <div className="flex -space-x-2.5 hover:space-x-1 transition-all duration-300">
        {displayVoters.map((v, i) => (
          <img key={i} src={resolveAvatar(v.name, v.image, v.isAnonymous)} alt={v.name ?? "Voter"} title={v.isAnonymous ? "Anonymous voter" : (v.name ?? "Voter")} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover bg-gray-50 shrink-0 hover:scale-110 transition-transform hover:z-50 relative" style={{ zIndex: displayVoters.length - i }} />
        ))}
        {overflow > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shadow-sm shrink-0 hover:scale-110 transition-transform relative z-0">
            <span className="text-[10px] font-extrabold text-gray-500">+{overflow}</span>
          </div>
        )}
      </div>
      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">{totalCount} votes</span>
    </div>
  );
};

const PollDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [poll, setPoll] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const votedPolls = getVotedPolls();
    if (votedPolls.has(slug)) setHasVoted(true);

    getPublicPoll(slug)
      .then(async (res) => {
        setPoll(res.data);
        try {
          const rRes = await getPublicPollResults(slug);
          setResults(rRes.data);
        } catch {}
      })
      .catch((err) => setError(err.message || "Failed to load poll."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmitVote = async () => {
    if (!poll || !slug) return;
    if (poll.responseMode === "AUTHENTICATED" && !isAuthenticated) {
      navigate(`/signin?redirect=/p/${slug}`);
      return;
    }

    const requiredMissing = poll.questions.filter((q: any) => q.isRequired && !selectedOptions[q.id]);
    if (requiredMissing.length > 0) {
      setVoteError("Please answer all required questions.");
      return;
    }

    setVoting(true);
    setVoteError("");

    try {
      const fingerprint = getOrCreateFingerprint();
      const isAnon = poll.responseMode === "ANONYMOUS";
      const answers = Object.entries(selectedOptions).map(([questionId, optionId]) => ({ questionId, optionId }));

      await submitPublicResponse(slug, answers, isAnon, fingerprint);
      markPollVoted(slug);
      setHasVoted(true);

      try {
        const rRes = await getPublicPollResults(slug);
        setResults(rRes.data);
      } catch {}
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
    return <div className="flex flex-col items-center justify-center py-24 gap-3"><div className="w-8 h-8 border-2 border-brand-crimson border-t-transparent rounded-full animate-spin" /><p className="text-gray-400 text-sm">Loading poll...</p></div>;
  }

  if (error || !poll) {
    return <div className="flex flex-col items-center justify-center py-24 gap-4 text-center"><div className="text-5xl">Oops</div><h2 className="text-2xl font-bold text-gray-900">Poll not found</h2><p className="text-gray-500">{error || "This poll may have been removed or the link is incorrect."}</p><Link to="/explorer" className="mt-2 text-brand-crimson font-bold text-sm hover:underline">Browse public polls</Link></div>;
  }

  const isPollExpired = !!poll.isExpired;
  const requiresAuth = poll.responseMode === "AUTHENTICATED";
  const isAnonymousPoll = poll.responseMode === "ANONYMOUS";
  const requiredMissingCount = poll.questions.filter((q: any) => q.isRequired && !selectedOptions[q.id]).length;

  const timeLeft = (() => {
    const ms = new Date(poll.expiresAt).getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) return `Voting ends in ${hours}h`;
    return `Voting ends in ${Math.floor(hours / 24)} days`;
  })();

  const avatarUrl = poll.creator?.image ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(poll.creator?.name ?? slug ?? "poll")}`;

  const getResultOption = (questionId: string, optionId: string) => {
    const q = results?.questions?.find((entry: any) => entry.questionId === questionId);
    return q?.options?.find((o: any) => o.optionId === optionId);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full gap-12 lg:gap-16 text-gray-900 mt-6 md:mt-10 mb-20">
      <main className="flex-1 flex flex-col gap-8 max-w-3xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-gray-400">
              <Link to="/explorer" className="hover:text-brand-crimson transition-colors">EXPLORER</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">ACTIVE POLL</span>
            </div>
          </div>

          <div className="flex gap-5 sm:gap-6 items-start mt-2 bg-white border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-sm">
            <img src={avatarUrl} alt="Creator" className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border-2 border-white shadow-md rounded-full shrink-0 object-cover" />
            <div className="flex flex-col gap-3 sm:gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">{poll.title}</h1>
              <p className="text-sm font-medium text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-brand-crimson bg-brand-crimson/5 px-2 py-0.5 rounded-full border border-brand-crimson/10">{results?.overview?.totalResponses ?? 0} votes</span>
              </p>
            </div>
          </div>
        </div>

        {requiresAuth && !isAuthenticated && !isPollExpired && (
          <div className="flex flex-col items-center gap-5 p-10 border-2 border-yellow-100 bg-yellow-50/50 rounded-3xl text-center shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900">Sign in to vote</h3>
            <Link to={`/signin?redirect=/p/${slug}`} className="mt-2 bg-brand-crimson text-white px-8 py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase">SIGN IN TO VOTE</Link>
          </div>
        )}

        {(!requiresAuth || isAuthenticated) && !isPollExpired && (
          <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-8">
            {poll.questions.map((question: any, qIndex: number) => (
              <div key={question.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Question {qIndex + 1}</h3>
                  {!question.isRequired && <span className="text-xs text-gray-500 font-semibold uppercase">Optional</span>}
                </div>
                <p className="text-base font-semibold text-gray-800">{question.text}</p>

                {question.options.map((option: any) => {
                  const resultOption = getResultOption(question.id, option.id);
                  const pct = resultOption?.percentage ?? 0;
                  const count = resultOption?.count ?? 0;
                  const voterPreviews: VoterPreview[] = resultOption?.voterPreviews ?? [];
                  const isSelected = selectedOptions[question.id] === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => !hasVoted && setSelectedOptions((prev) => ({ ...prev, [question.id]: option.id }))}
                      disabled={hasVoted}
                      className={`flex flex-col gap-4 p-5 sm:p-6 border-2 transition-all duration-300 text-left group rounded-2xl ${
                        hasVoted && results
                          ? "cursor-default border-gray-100 bg-gray-50/50"
                          : isSelected
                          ? "border-brand-crimson bg-brand-crimson/5 text-brand-crimson shadow-md shadow-brand-crimson/10 -translate-y-0.5"
                          : "border-gray-100 text-gray-700 hover:border-brand-crimson/30 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-4 w-full">
                        {!hasVoted && <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-brand-crimson bg-brand-crimson" : "border-gray-300 bg-white group-hover:border-brand-crimson/50"}`}>{isSelected && <div className="w-2 h-2 rounded-full bg-white" />}</div>}
                        <span className={`text-lg sm:text-xl font-bold flex-1 ${isSelected ? "text-brand-crimson" : "text-gray-900"}`}>{option.label}</span>
                        {hasVoted && results && <AvatarStack voters={voterPreviews} totalCount={count} isAnonymousMode={isAnonymousPoll} />}
                      </div>

                      {hasVoted && results && (
                        <div className="flex items-center gap-4 w-full">
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-brand-crimson rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${pct}%` }} /></div>
                          <span className="text-sm font-extrabold text-brand-crimson w-12 text-right tabular-nums bg-brand-crimson/10 px-2 py-1 rounded-md">{pct}%</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {!hasVoted && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-widest uppercase text-gray-500">{timeLeft}</span>
                  {requiredMissingCount > 0 && <span className="text-xs text-amber-700 mt-1">{requiredMissingCount} required question(s) left</span>}
                </div>
                <button onClick={handleSubmitVote} disabled={requiredMissingCount > 0 || voting} className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-4 rounded-xl font-bold tracking-widest uppercase text-sm disabled:opacity-50 w-full sm:w-auto">{voting ? "SUBMITTING..." : "SUBMIT VOTE"}</button>
              </div>
            )}

            {voteError && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">{voteError}</div>}
          </div>
        )}

        {((hasVoted && results) || (isPollExpired && results)) && (
          <div className="flex flex-col gap-6 mt-4 pb-12">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4"><h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Final Results</h2></div>

            {(isPollExpired || poll?.isAnnounced) && (
              <div className="flex flex-col gap-8">
                {results.questions.map((rq: any, qIndex: number) => (
                  <div key={rq.questionId} className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-gray-900">Question {qIndex + 1}: {rq.questionText}</h3>
                    {rq.options.map((opt: any) => (
                      <div key={opt.optionId} className="flex flex-col gap-3 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">{opt.optionLabel}</span>
                          <span className="text-lg font-extrabold text-brand-crimson tabular-nums bg-brand-crimson/10 px-3 py-1 rounded-lg">{opt.percentage}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-brand-crimson rounded-full transition-all duration-1000" style={{ width: `${opt.percentage}%` }} /></div>
                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                          <p className="text-sm font-medium text-gray-400">{opt.count} vote{opt.count !== 1 ? "s" : ""}</p>
                          <AvatarStack voters={opt.voterPreviews ?? []} totalCount={opt.count} isAnonymousMode={isAnonymousPoll} />
                        </div>
                        {opt.demographics && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 mt-2 border-t border-gray-100">
                            {opt.demographics.gender?.length > 0 && (
                              <div className="flex flex-col gap-3">
                                <p className="text-xs font-bold tracking-widest uppercase text-gray-400">By Gender</p>
                                <div className="flex flex-col gap-3">
                                  {opt.demographics.gender.map((slice: any, idx: number) => {
                                    const meta = genderLabel[slice.label];
                                    return <DemoBar key={slice.label} label={meta?.text ?? slice.label} count={slice.count} percentage={slice.percentage} color={GENDER_COLORS[idx % GENDER_COLORS.length]} />;
                                  })}
                                </div>
                              </div>
                            )}
                            {opt.demographics.ageGroups?.length > 0 && (
                              <div className="flex flex-col gap-3">
                                <p className="text-xs font-bold tracking-widest uppercase text-gray-400">By Age Group</p>
                                <div className="flex flex-col gap-3">
                                  {opt.demographics.ageGroups.map((slice: any, idx: number) => <DemoBar key={slice.label} label={slice.label} count={slice.count} percentage={slice.percentage} color={AGE_COLORS[idx % AGE_COLORS.length]} />)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <aside className="w-full lg:w-80 flex flex-col gap-8 shrink-0">
        <div className="flex flex-col gap-5 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2"><h3 className="text-sm font-extrabold tracking-wide text-gray-900">Share Poll</h3></div>
          <div className="flex shadow-sm rounded-xl overflow-hidden border border-gray-200">
            <input type="text" readOnly value={window.location.href} className="flex-1 bg-gray-50/50 p-3 text-sm text-gray-600 focus:outline-none" />
            <button onClick={copyLink} className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-4 flex items-center justify-center transition-colors border-l border-brand-crimson">{linkCopied ? "Done" : <span className="text-xs font-bold uppercase tracking-wider">Copy</span>}</button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default PollDetailsPage;

