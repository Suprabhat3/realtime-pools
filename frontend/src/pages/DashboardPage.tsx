import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCreatorPolls, type PollSummary } from "../lib/polls-api";

const DashboardPage = () => {
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    getCreatorPolls()
      .then((res) => setPolls(res.data))
      .catch((err) => console.error("Failed to fetch polls", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyLink = (poll: PollSummary) => {
    const url = `${window.location.origin}/p/${poll.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(poll.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const activePolls = polls.filter((p) => p.isPublished && new Date(p.expiresAt) > new Date()).length;
  const totalVotes = polls.reduce((sum, p) => sum + (p.totalResponses ?? 0), 0);

  return (
    <div className="flex w-full h-full gap-12 text-gray-900 mt-4">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col gap-8 shrink-0">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 ml-4">Dashboard</h2>
        <nav className="flex flex-col gap-2 relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-crimson" />

          <button className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-brand-crimson bg-red-50/50">
            <div className="w-4 h-4 rounded-full border-2 border-brand-crimson" />
            My Polls
          </button>
          <Link
            to="/explorer"
            className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
            Explore
          </Link>
        </nav>

        <Link
          to="/create"
          className="w-full bg-brand-crimson hover:bg-brand-crimson-hover text-white py-3.5 px-4 text-center font-bold text-sm tracking-wide shadow-sm transition-colors mt-4"
        >
          + NEW POLL
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl flex flex-col gap-8 pb-12">
        <div className="flex flex-col gap-2 border-b border-brand-crimson/20 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">My Polls</h1>
          <p className="text-gray-600 text-lg">Manage and track your active campaigns.</p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-8 py-4 px-2">
          <div className="flex flex-col pr-12 border-r border-gray-200">
            <span className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-1">TOTAL POLLS</span>
            <span className="text-5xl font-normal tracking-tighter text-gray-900">{polls.length}</span>
          </div>
          <div className="flex flex-col pr-12 border-r border-gray-200">
            <span className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-1">TOTAL VOTES</span>
            <span className="text-5xl font-normal tracking-tighter text-gray-900">{totalVotes}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-1">ACTIVE</span>
            <span className="text-5xl font-normal tracking-tighter text-gray-900">{activePolls}</span>
          </div>
        </div>

        {/* Poll List */}
        <div className="flex flex-col gap-6 mt-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 p-8 shadow-sm animate-pulse rounded-sm">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : polls.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="text-5xl">🗳️</div>
              <h3 className="text-xl font-bold text-gray-900">No polls yet</h3>
              <p className="text-gray-500">Create your first poll to get started.</p>
              <Link
                to="/create"
                className="mt-2 bg-brand-crimson hover:bg-brand-crimson-hover text-white px-6 py-3 text-sm font-bold tracking-widest uppercase transition-colors"
              >
                CREATE POLL
              </Link>
            </div>
          ) : (
            polls.map((poll) => {
              const isActive = !poll.isPublished && new Date(poll.expiresAt) > new Date();
              const isDraft = !poll.isPublished && new Date(poll.expiresAt) <= new Date();
              const isClosed = poll.isPublished;

              return (
                <div
                  key={poll.id}
                  className={`bg-white border p-8 shadow-sm flex flex-col gap-4 rounded-sm ${
                    isClosed ? "opacity-75 border-gray-100" : isActive ? "border-red-100" : "border-gray-100"
                  }`}
                >
                  {/* Status row */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className={`flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase ${isActive ? "text-brand-crimson" : "text-gray-400"}`}>
                      {isActive && (
                        <><div className="w-2 h-2 rounded-full bg-brand-crimson animate-pulse" /> ACTIVE</>
                      )}
                      {isDraft && (
                        <><div className="w-1.5 h-1.5 rounded-full border border-gray-500" /> DRAFT</>
                      )}
                      {isClosed && <>× CLOSED</>}
                    </div>

                    {/* Visibility badge */}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${poll.isPublic ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                      {poll.isPublic ? "🌍 Public" : "🔒 Private"}
                    </span>

                    {/* Auth badge */}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${poll.responseMode === "AUTHENTICATED" ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-500"}`}>
                      {poll.responseMode === "AUTHENTICATED" ? "🔐 Auth required" : "👤 Open voting"}
                    </span>

                    <span className="text-gray-300 text-xs ml-auto">{new Date(poll.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Title + actions */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className={`text-2xl font-${isActive ? "semibold" : "medium"} text-gray-900 leading-tight`}>
                        {poll.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {poll.totalResponses ?? 0} vote{(poll.totalResponses ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Copy link — always available */}
                      <button
                        onClick={() => handleCopyLink(poll)}
                        className="border border-brand-crimson/30 text-gray-700 hover:bg-gray-50 text-xs font-bold tracking-widest uppercase px-4 py-2 transition-colors flex items-center gap-1.5"
                      >
                        {copiedId === poll.id ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            COPIED
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            COPY LINK
                          </>
                        )}
                      </button>

                      {/* View poll */}
                      <Link
                        to={`/p/${poll.slug}`}
                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold tracking-widest uppercase px-4 py-2 transition-colors"
                      >
                        VIEW
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
