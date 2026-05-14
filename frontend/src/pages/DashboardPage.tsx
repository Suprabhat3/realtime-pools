import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { closePoll, getCreatorPolls, announcePollResults, type PollSummary } from "../lib/polls-api";
import { getRealtimeSocket } from "../lib/realtime";

const DashboardPage = () => {
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [announcingId, setAnnouncingId] = useState<string | null>(null);

  const refreshTimeoutRef = useRef<number | null>(null);

  const fetchPolls = useCallback(() => {
    setLoading(true);
    getCreatorPolls()
      .then((res) => setPolls(res.data))
      .catch((err) => console.error("Failed to fetch polls", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const joinedPollIds = new Set<string>();

    polls.forEach((poll) => {
      if (!joinedPollIds.has(poll.id)) {
        socket.emit("poll:join-owner", { pollId: poll.id });
        joinedPollIds.add(poll.id);
      }
    });

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = window.setTimeout(() => {
        fetchPolls();
      }, 250);
    };

    socket.on("responses:count", scheduleRefresh);
    socket.on("analytics:update", scheduleRefresh);

    return () => {
      joinedPollIds.forEach((pollId) => {
        socket.emit("poll:leave-owner", { pollId });
      });
      socket.off("responses:count", scheduleRefresh);
      socket.off("analytics:update", scheduleRefresh);
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [polls, fetchPolls]);

  const handleCopyLink = (poll: PollSummary) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${poll.slug}`).then(() => {
      setCopiedId(poll.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleClose = async (poll: PollSummary) => {
    if (!confirm(`Close "${poll.title}"? Voting will stop immediately.`)) return;
    setClosingId(poll.id);
    try {
      await closePoll(poll.id);
      fetchPolls();
    } catch (err: any) {
      alert(err.message ?? "Failed to close poll.");
    } finally {
      setClosingId(null);
    }
  };

  const handleAnnounce = async (poll: PollSummary) => {
    if (!confirm(`Announce results for "${poll.title}"? This will notify voters via email and make the demographics public.`)) return;
    setAnnouncingId(poll.id);
    try {
      await announcePollResults(poll.id);
      fetchPolls();
    } catch (err: any) {
      alert(err.message ?? "Failed to announce poll.");
    } finally {
      setAnnouncingId(null);
    }
  };

  const activeCount = polls.filter((p) => p.state === "active").length;
  const totalVotes = polls.reduce((sum, p) => sum + (p.totalResponses ?? 0), 0);

  const stateBadge = (poll: PollSummary) => {
    if (poll.state === "draft") {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest border border-gray-200"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> DRAFT</span>;
    }
    if (poll.state === "active") {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-brand-crimson text-[10px] font-bold uppercase tracking-widest border border-red-100"><div className="w-1.5 h-1.5 rounded-full bg-brand-crimson animate-pulse" /> ACTIVE</span>;
    }
    if (poll.isAnnounced) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-100"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ANNOUNCED</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest border border-gray-200"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> CLOSED</span>;
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-brand-cream/30">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-100 shrink-0 py-8 px-6 flex flex-col gap-8 shadow-[4px_0_24px_rgba(0,0,0,0.01)] z-10 relative">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-crimson to-red-600 flex items-center justify-center text-white shadow-lg shadow-brand-crimson/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Dashboard</h2>
        </div>
        
        <nav className="flex flex-col gap-1.5">
          <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-brand-crimson bg-red-50/50 shadow-sm border border-red-100/50 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            My Polls
          </button>
          <Link to="/explorer" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            Explore
          </Link>
        </nav>
        
        <div className="mt-auto pt-8 border-t border-gray-100">
          <Link to="/create" className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-4 px-4 rounded-xl font-bold text-sm tracking-widest shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
            <span>+</span> NEW POLL
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-8 pb-16 px-6 md:px-12 lg:px-16 max-w-6xl mx-auto w-full">
        <header className="flex flex-col gap-3 mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Campaign Overview
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl font-medium">
            Monitor engagement, announce results, and manage your active polls from one central command center.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden group hover:border-brand-crimson/30 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2 relative z-10">Total Polls</span>
            <span className="text-4xl font-extrabold text-gray-900 relative z-10">{polls.length}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden group hover:border-brand-crimson/30 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2 relative z-10">Total Votes</span>
            <span className="text-4xl font-extrabold text-gray-900 relative z-10">{totalVotes}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden group hover:border-brand-crimson/30 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-brand-crimson mb-2 relative z-10">Active Now</span>
            <span className="text-4xl font-extrabold text-brand-crimson relative z-10">{activeCount}</span>
          </div>
        </div>

        {/* Polls List */}
        <div className="flex flex-col gap-5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 p-8 shadow-sm animate-pulse rounded-3xl">
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded-full w-24" />
                  <div className="h-6 bg-gray-100 rounded-full w-20" />
                </div>
                <div className="h-8 bg-gray-200 rounded-lg w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/4" />
              </div>
            ))
          ) : polls.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-20 bg-white border border-gray-100 border-dashed rounded-3xl text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-4xl shadow-sm text-brand-crimson">🗳️</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">No polls yet</h3>
                <p className="text-gray-500 mt-1 max-w-sm mx-auto">Create your first poll to start engaging your audience and collecting feedback.</p>
              </div>
              <Link to="/create" className="mt-2 bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase transition-all hover:shadow-xl hover:-translate-y-0.5">
                Create First Poll
              </Link>
            </div>
          ) : (
            polls.map((poll) => (
              <div
                key={poll.id}
                className={`group bg-white p-6 sm:p-8 rounded-3xl border shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col gap-5 ${
                  poll.state === "closed" ? "border-gray-200" : poll.state === "active" ? "border-red-100 ring-1 ring-red-50" : "border-gray-200 border-dashed"
                }`}
              >
                {/* Status bar */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {stateBadge(poll)}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${poll.isPublic ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {poll.isPublic ? "🌍 Public" : "🔒 Private"}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${poll.responseMode === "AUTHENTICATED" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {poll.responseMode === "AUTHENTICATED" ? "🔐 Auth required" : "👤 Open"}
                  </span>
                  {poll.maxResponses && (
                    <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold tracking-widest uppercase border border-purple-100">
                      🎯 {poll.totalResponses}/{poll.maxResponses} votes
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-medium ml-auto hidden sm:block">
                    {new Date(poll.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Title */}
                <div className="flex flex-col gap-2 pr-4 sm:pr-8">
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight group-hover:text-brand-crimson transition-colors line-clamp-2">{poll.title}</h3>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className="text-brand-crimson bg-red-50 border border-red-100 px-2 py-0.5 rounded-md font-bold">{poll.totalResponses ?? 0} votes</span>
                    {poll.state === "active" && (
                      <span className="text-gray-400">· Closes {new Date(poll.expiresAt).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap pt-5 border-t border-gray-50">
                  <button
                    onClick={() => handleCopyLink(poll)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border border-gray-200 text-gray-600 hover:border-brand-crimson/30 hover:bg-red-50 hover:text-brand-crimson bg-white"
                  >
                    {copiedId === poll.id ? (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Link</>
                    )}
                  </button>

                  <Link to={`/p/${poll.slug}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 bg-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    View
                  </Link>

                  <Link to={`/polls/${poll.id}/analytics`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border border-brand-crimson text-brand-crimson hover:bg-brand-crimson hover:text-white shadow-sm hover:shadow-md bg-white hover:bg-brand-crimson">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    Analytics
                  </Link>

                  <div className="flex-1" />

                  {poll.state === "active" && (
                    <button
                      onClick={() => handleClose(poll)}
                      disabled={closingId === poll.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 bg-white"
                    >
                      {closingId === poll.id ? "Closing..." : "Close Early"}
                    </button>
                  )}

                  {poll.state === "closed" && !poll.isAnnounced && (
                    <button
                      onClick={() => handleAnnounce(poll)}
                      disabled={announcingId === poll.id}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      {announcingId === poll.id ? "Announcing..." : "Announce Results"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

