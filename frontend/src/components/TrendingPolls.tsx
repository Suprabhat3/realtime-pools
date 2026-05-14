import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublicPolls, type PublicPollCard } from "../lib/polls-api";

const timeLeft = (expiresAt: string): string => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
};

const TrendingPollCard = ({ poll, rank }: { poll: PublicPollCard; rank: number }) => {
  const avatarUrl =
    poll.creator.image ??
    `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
      poll.creator.name ?? poll.slug
    )}`;

  return (
    <Link
      to={`/p/${poll.slug}`}
      className="group relative flex flex-col bg-white border border-gray-100 hover:border-brand-crimson/40 shadow-md hover:shadow-xl rounded-xl transition-all duration-300 overflow-hidden"
    >
      {/* Header section */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-crimson/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-extrabold text-brand-crimson">#{rank}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-brand-crimson uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-crimson animate-pulse" />
              Live
            </div>
            <span className="text-xs font-medium text-gray-400">{timeLeft(poll.expiresAt)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 px-6 pb-6 flex-1">
        <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-brand-crimson transition-colors line-clamp-2">
          {poll.title}
        </h3>

        {/* Top 2 options preview */}
        {poll.firstQuestion && (
          <div className="flex flex-col gap-2.5">
            {poll.firstQuestion.options.slice(0, 2).map((opt) => (
              <div
                key={opt.id}
                className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 border border-transparent group-hover:bg-brand-crimson/5 group-hover:border-brand-crimson/20 rounded-lg px-4 py-3 transition-colors"
              >
                <div className="w-4 h-4 rounded-full border-[3px] border-gray-300 group-hover:border-brand-crimson/40 shrink-0 bg-white" />
                <span className="truncate font-medium">{opt.label}</span>
              </div>
            ))}
            {poll.firstQuestion.options.length > 2 && (
              <p className="text-xs font-medium text-gray-400 pl-1 mt-1">
                + {poll.firstQuestion.options.length - 2} more options
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
          <img
            src={avatarUrl}
            alt={poll.creator.name ?? "creator"}
            className="w-8 h-8 rounded-full bg-gray-100 shrink-0 border border-gray-200"
          />
          <span className="text-sm font-semibold text-gray-600 truncate flex-1">
            {poll.creator.name ?? "Anonymous"}
          </span>
          <span className="text-xs font-bold text-brand-crimson bg-brand-crimson/5 px-2.5 py-1 rounded-full shrink-0 border border-brand-crimson/10">
            {poll.maxResponses
              ? `${poll.totalVotes} / ${poll.maxResponses} votes`
              : `${poll.totalVotes} votes`}
          </span>
        </div>
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="flex flex-col bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden animate-pulse">
    <div className="flex items-center gap-3 px-6 pt-6 pb-4">
      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
      <div className="flex flex-col gap-1.5">
        <div className="h-2.5 bg-gray-200 rounded w-10" />
        <div className="h-2.5 bg-gray-200 rounded w-16" />
      </div>
    </div>
    <div className="flex flex-col gap-5 px-6 pb-6">
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-full" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
      </div>
      <div className="space-y-2.5">
        <div className="h-11 bg-gray-100 rounded-lg w-full" />
        <div className="h-11 bg-gray-100 rounded-lg w-full" />
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
        <div className="h-4 bg-gray-100 rounded w-24 flex-1" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
    </div>
  </div>
);

const TrendingPolls = () => {
  const [polls, setPolls] = useState<PublicPollCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicPolls()
      .then((res) => setPolls(res.data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full bg-brand-cream/60 border-t border-gray-100 py-16 sm:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="flex flex-col gap-2">
            <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-crimson animate-pulse" />
              Trending right now
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              What the world is <br className="hidden sm:block" />
              <span className="text-brand-crimson">talking about</span>
            </h2>
          </div>

          <Link
            to="/explorer"
            className="group self-start sm:self-auto flex items-center gap-2 border border-brand-crimson/30 text-brand-crimson hover:bg-brand-crimson hover:text-white px-5 py-2.5 text-sm font-bold tracking-wide transition-all duration-200 shrink-0"
          >
            Explore all polls
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:translate-x-1 transition-transform"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : polls.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
              <div className="text-5xl">🗳️</div>
              <p className="text-gray-500 font-medium">No public polls yet. Be the first!</p>
              <Link
                to="/create"
                className="mt-2 bg-brand-crimson text-white px-6 py-3 text-sm font-bold tracking-widest uppercase hover:bg-brand-crimson-hover transition-colors"
              >
                CREATE A POLL
              </Link>
            </div>
          ) : (
            polls.map((poll, i) => (
              <TrendingPollCard key={poll.id} poll={poll} rank={i + 1} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingPolls;
