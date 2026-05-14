import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublicPolls, type PublicPollCard } from "../lib/polls-api";

const categories = ["All Topics", "Technology", "Lifestyle", "Business", "Entertainment", "Politics", "Sports"];

const timeLeft = (expiresAt: string): string => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
};

const PollCard = ({ poll }: { poll: PublicPollCard }) => {
  const avatarUrl = poll.creator.image ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(poll.creator.name ?? poll.slug)}`;

  return (
    <Link
      to={`/p/${poll.slug}`}
      className="group flex flex-col bg-white border border-gray-100 hover:border-brand-crimson/40 shadow-sm hover:shadow-md transition-all duration-200 rounded-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-gray-50">
        <img src={avatarUrl} alt={poll.creator.name ?? "creator"} className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700 truncate">{poll.creator.name ?? "Anonymous"}</p>
          <p className="text-xs text-gray-400">{new Date(poll.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold shrink-0 uppercase">
          {poll.isAnnounced ? (
            <span className="text-green-600 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              ANNOUNCED
            </span>
          ) : (
            <span className="text-brand-crimson flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-crimson animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-5 py-4 flex-1">
        <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-brand-crimson transition-colors line-clamp-2">
          {poll.title}
        </h3>

        {poll.firstQuestion && (
          <div className="flex flex-col gap-1.5 mt-1">
            {poll.firstQuestion.options.slice(0, 3).map((opt) => (
              <div
                key={opt.id}
                className="flex items-center gap-2 text-xs text-gray-600 border border-gray-100 rounded px-2.5 py-1.5 group-hover:border-brand-crimson/20 transition-colors"
              >
                <div className="w-3 h-3 rounded-full border border-gray-300 shrink-0" />
                {opt.label}
              </div>
            ))}
            {poll.firstQuestion.options.length > 3 && (
              <p className="text-xs text-gray-400 pl-1">+{poll.firstQuestion.options.length - 3} more options</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {poll.maxResponses
            ? `${poll.totalVotes} / ${poll.maxResponses} votes`
            : `${poll.totalVotes} ${poll.totalVotes === 1 ? "vote" : "votes"}`}
        </span>
        <span className="text-xs font-medium text-gray-400">
          {poll.isAnnounced ? "Closed" : timeLeft(poll.expiresAt)}
        </span>
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="flex flex-col bg-white border border-gray-100 shadow-sm rounded-sm overflow-hidden animate-pulse">
    <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-gray-50">
      <div className="w-8 h-8 rounded-full bg-gray-200" />
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-2.5 bg-gray-100 rounded w-16" />
      </div>
    </div>
    <div className="flex flex-col gap-3 px-5 py-4 flex-1">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="h-7 bg-gray-100 rounded" />
        <div className="h-7 bg-gray-100 rounded" />
        <div className="h-7 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/50">
      <div className="h-3 bg-gray-200 rounded w-16" />
      <div className="h-3 bg-gray-100 rounded w-12" />
    </div>
  </div>
);

const ExplorerPage = () => {
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [polls, setPolls] = useState<PublicPollCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    listPublicPolls(activeCategory)
      .then((res) => setPolls(res.data))
      .catch((err) => setError(err.message ?? "Failed to load polls."))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="flex flex-col w-full text-gray-900 mt-4">
      <div className="flex flex-col gap-4 max-w-3xl mb-10">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">Explore Trends</h1>
        <p className="text-lg text-gray-600">
          Discover what the world is thinking. Vote on trending topics across technology, lifestyle, and more.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-3 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 text-sm font-semibold transition-colors border ${
              activeCategory === cat
                ? "bg-brand-crimson text-white border-brand-crimson shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-crimson hover:text-brand-crimson"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="col-span-full mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : polls.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="text-5xl mb-4">🗳️</div>
            <p className="text-gray-500 font-medium text-lg">No public polls yet in this category.</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon or create one yourself!</p>
          </div>
        ) : (
          polls.map((poll) => <PollCard key={poll.id} poll={poll} />)
        )}
      </div>

      {/* Load more placeholder */}
      {!loading && polls.length > 0 && (
        <div className="flex justify-center mb-12">
          <button className="border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 text-xs font-bold tracking-widest uppercase px-8 py-3.5 transition-colors flex items-center gap-2 bg-white">
            LOAD MORE
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExplorerPage;
