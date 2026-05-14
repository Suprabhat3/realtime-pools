import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPollAnalytics, announcePollResults } from "../lib/polls-api";

interface DemographicSlice {
  label: string;
  count: number;
  percentage: number;
}

interface OptionAnalytics {
  optionId: string;
  optionLabel: string;
  count: number;
  percentage: number;
  voterCards: {
    name: string;
    image: string | null;
    isAnonymous: boolean;
    gender: string | null;
    ageGroup: string | null;
  }[];
  voterPreviews: { name: string | null; image: string | null; isAnonymous: boolean }[];
  demographics: {
    gender: DemographicSlice[];
    ageGroups: DemographicSlice[];
  } | null;
}

interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  answeredCount: number;
  skippedCount: number;
  optionCounts: OptionAnalytics[];
}

interface Analytics {
  poll: {
    id: string;
    slug: string;
    title: string;
    responseMode: string;
    state: string;
    isAnnounced?: boolean;
  };
  overview: {
    totalResponses: number;
    authenticatedResponses: number;
    anonymousResponses: number;
    hasSufficientDemoData: boolean;
  };
  questions: QuestionAnalytics[];
  updatedAt: string;
}

const resolveAvatar = (name: string | null, image: string | null, isAnonymous: boolean): string => {
  if (!isAnonymous && image) return image;
  if (!isAnonymous && name) {
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;
  }
  return `https://api.dicebear.com/7.x/shapes/svg?seed=anon&backgroundColor=e2e8f0`;
};

const genderLabel: Record<string, { icon: string; color: string; text: string }> = {
  MALE:             { icon: "M", color: "text-blue-500",   text: "Male" },
  FEMALE:           { icon: "F", color: "text-pink-500",   text: "Female" },
  NON_BINARY:       { icon: "NB", color: "text-purple-500", text: "Non-binary" },
  PREFER_NOT_TO_SAY:{ icon: "-", color: "text-gray-400",   text: "Prefer not to say" }
};

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

const GENDER_COLORS = ["text-blue-500", "text-pink-500", "text-purple-500", "text-gray-400"];
const AGE_COLORS    = ["text-teal-500", "text-cyan-500", "text-sky-500", "text-indigo-500", "text-violet-500", "text-fuchsia-500"];

const OptionCard = ({
  opt,
  totalVotes,
  hasDemoData
}: {
  opt: OptionAnalytics;
  totalVotes: number;
  hasDemoData: boolean;
}) => {
  const [showAllVoters, setShowAllVoters] = useState(false);
  const visibleVoters = showAllVoters ? opt.voterCards : opt.voterCards.slice(0, 6);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col gap-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{opt.optionLabel}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {opt.count} vote{opt.count !== 1 ? "s" : ""} - {opt.percentage}% of total
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-4xl font-black text-brand-crimson tabular-nums">{opt.percentage}%</div>
        </div>
      </div>

      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-crimson rounded-full transition-all duration-700"
          style={{ width: `${(opt.count / Math.max(totalVotes, 1)) * 100}%` }}
        />
      </div>

      {hasDemoData && opt.demographics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-gray-50">
          {opt.demographics.gender.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400">By Gender</p>
              <div className="flex flex-col gap-3">
                {opt.demographics.gender.map((slice, idx) => {
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

          {opt.demographics.ageGroups.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400">By Age Group</p>
              <div className="flex flex-col gap-3">
                {opt.demographics.ageGroups.map((slice, idx) => (
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

          {opt.demographics.gender.length === 0 && opt.demographics.ageGroups.length === 0 && (
            <p className="text-xs text-gray-400 col-span-2">No demographic data available for this option yet.</p>
          )}
        </div>
      ) : hasDemoData && !opt.demographics ? (
        <p className="text-xs text-gray-400">No demographic data yet.</p>
      ) : null}

      {opt.voterCards.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-50">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400">
            Voters ({opt.voterCards.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleVoters.map((voter, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <img
                  src={resolveAvatar(voter.name, voter.image, voter.isAnonymous)}
                  alt={voter.name}
                  className="w-8 h-8 rounded-full bg-gray-200 object-cover shrink-0 border border-white"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-800 truncate">
                    {voter.isAnonymous ? "Anonymous" : voter.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!voter.isAnonymous && voter.gender && (
                      <span className={`text-[10px] font-bold ${genderLabel[voter.gender]?.color ?? "text-gray-400"}`}>
                        {genderLabel[voter.gender]?.text ?? voter.gender}
                      </span>
                    )}
                    {!voter.isAnonymous && voter.ageGroup && (
                      <span className="text-[10px] text-gray-400">{voter.ageGroup}</span>
                    )}
                    {voter.isAnonymous && (
                      <span className="text-[10px] text-gray-400">Anonymous voter</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {opt.voterCards.length > 6 && (
            <button
              onClick={() => setShowAllVoters(!showAllVoters)}
              className="text-xs font-bold text-brand-crimson hover:underline self-start"
            >
              {showAllVoters
                ? "Show less"
                : `Show all ${opt.voterCards.length} voters`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const PollAnalyticsPage = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [announcing, setAnnouncing] = useState(false);

  useEffect(() => {
    if (!pollId) return;
    getPollAnalytics(pollId)
      .then((res: any) => setAnalytics((res?.data ?? res) as Analytics))
      .catch((err) => setError(err.message || "Failed to load analytics."))
      .finally(() => setLoading(false));
  }, [pollId]);

  const handleAnnounce = async () => {
    if (!analytics) return;
    if (confirm("Are you sure you want to announce the results? This will notify voters via email and make the demographics public.")) {
      setAnnouncing(true);
      try {
        await announcePollResults(analytics.poll.id);
        setAnalytics({
          ...analytics,
          poll: { ...analytics.poll, isAnnounced: true }
        });
      } catch (err: any) {
        alert(err.message || "Failed to announce poll results.");
      } finally {
        setAnnouncing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-brand-crimson border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="text-5xl">Analytics</div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics unavailable</h2>
        <p className="text-gray-500">{error || "Could not load analytics for this poll."}</p>
        <Link to="/dashboard" className="mt-2 text-brand-crimson font-bold text-sm hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { overview } = analytics;
  const totalOptions = analytics.questions.reduce((sum, q) => sum + q.optionCounts.length, 0);

  return (
    <div className="flex w-full h-full gap-12 text-gray-900 mt-4 pb-16">
      <aside className="w-64 hidden md:flex flex-col gap-8 shrink-0">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 ml-4">Analytics</h2>
        <nav className="flex flex-col gap-2 relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-crimson" />
          <Link to="/dashboard" className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <div className="w-4 h-4 rounded-full border-2 border-gray-400" /> Dashboard
          </Link>
          <Link to={`/p/${analytics.poll.slug}`} className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <div className="w-4 h-4 rounded-full border-2 border-gray-400" /> View Poll
          </Link>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col gap-8 max-w-4xl">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-500">
          <Link to="/dashboard" className="hover:text-brand-crimson transition-colors">DASHBOARD</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 truncate max-w-[180px]">{analytics.poll.title}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">ANALYTICS</span>
        </div>

        <div className="flex flex-col gap-2 border-b border-brand-crimson/20 pb-6 relative">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded tracking-wide ${analytics.poll.state === "active" ? "bg-red-50 text-brand-crimson" : "bg-gray-100 text-gray-500"}`}>
              {analytics.poll.state.toUpperCase()}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 tracking-wide">
              {analytics.poll.responseMode === "AUTHENTICATED" ? "Auth required" : "Open"}
            </span>
            {analytics.poll.isAnnounced && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 tracking-wide">ANNOUNCED</span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-tight pr-40">{analytics.poll.title}</h1>
          <p className="text-sm text-gray-500">Creator-only analytics | Last updated {new Date(analytics.updatedAt).toLocaleTimeString()}</p>

          {analytics.poll.state === "closed" && !analytics.poll.isAnnounced && (
            <div className="absolute right-0 top-0 sm:top-2 mt-2">
              <button
                onClick={handleAnnounce}
                disabled={announcing}
                className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase shadow-sm transition-colors disabled:opacity-50"
              >
                {announcing ? "ANNOUNCING..." : "ANNOUNCE RESULTS"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Votes", value: overview.totalResponses, color: "text-brand-crimson" },
            { label: "Authenticated", value: overview.authenticatedResponses, color: "text-blue-600" },
            { label: "Anonymous", value: overview.anonymousResponses, color: "text-gray-500" },
            { label: "Options", value: totalOptions, color: "text-gray-700" }
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col gap-1">
              <span className="text-xs font-bold tracking-widest uppercase text-gray-400">{stat.label}</span>
              <span className={`text-4xl font-black tabular-nums ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {!overview.hasSufficientDemoData && overview.authenticatedResponses > 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <span className="text-xl mt-0.5">!</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Demographic data hidden</p>
              <p className="text-xs text-amber-700 mt-0.5">
                At least 3 authenticated voters are needed to display gender and age breakdowns.
                Currently {overview.authenticatedResponses} authenticated voter{overview.authenticatedResponses !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        )}

        {overview.authenticatedResponses === 0 && overview.totalResponses > 0 && (
          <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <span className="text-xl mt-0.5">i</span>
            <div>
              <p className="text-sm font-bold text-gray-700">No demographic data available</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Demographic breakdowns (gender, age groups) are only available for authenticated voters.
                All current responses are anonymous.
              </p>
            </div>
          </div>
        )}

        {analytics.questions.map((question, index) => (
          <div key={question.questionId} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Poll Question {index + 1}</p>
              <h2 className="text-xl font-bold text-gray-900">{question.questionText}</h2>
              <p className="text-sm text-gray-500">
                {question.answeredCount} response{question.answeredCount !== 1 ? "s" : ""}
                {question.skippedCount > 0 && ` · ${question.skippedCount} skipped`}
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {question.optionCounts.map((opt) => (
                <OptionCard
                  key={opt.optionId}
                  opt={opt}
                  totalVotes={overview.totalResponses}
                  hasDemoData={overview.hasSufficientDemoData}
                />
              ))}
            </div>
          </div>
        ))}

        {overview.totalResponses === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="text-5xl">No votes</div>
            <h3 className="text-xl font-bold text-gray-900">No votes yet</h3>
            <p className="text-gray-500 text-sm">Share your poll to start collecting responses.</p>
            <Link
              to={`/p/${analytics.poll.slug}`}
              className="mt-2 bg-brand-crimson hover:bg-brand-crimson-hover text-white px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors"
            >
              VIEW POLL PAGE
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default PollAnalyticsPage;

