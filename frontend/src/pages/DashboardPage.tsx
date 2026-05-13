import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCreatorPolls, type PollSummary } from "../lib/polls-api";

const DashboardPage = () => {
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreatorPolls()
      .then((res) => {
        setPolls(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch polls", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex w-full h-full gap-12 text-gray-900 mt-4">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col gap-8 shrink-0">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 ml-4">Dashboard</h2>
        <nav className="flex flex-col gap-2 relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-crimson"></div>
          
          <button className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-brand-crimson bg-red-50/50">
            <div className="w-4 h-4 rounded-full border-2 border-brand-crimson"></div>
            My Polls
          </button>
          <button className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
            Participated
          </button>
          <button className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <div className="w-4 h-0.5 bg-gray-400"></div>
            Analytics
          </button>
          <button className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Settings
          </button>
        </nav>
        
        <Link to="/create" className="w-full bg-brand-crimson hover:bg-brand-crimson-hover text-white py-3.5 px-4 text-center font-bold text-sm tracking-wide shadow-sm transition-colors mt-4">
          NEW POLL
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
            <span className="text-5xl font-normal tracking-tighter text-gray-900">--</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-1">AVG. ENGAGEMENT</span>
            <span className="text-5xl font-normal tracking-tighter text-gray-900">--</span>
          </div>
        </div>

        {/* Poll List */}
        <div className="flex flex-col gap-6 mt-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading polls...</div>
          ) : (
            <>
              {/* Actual Polls from DB */}
              {polls.map((poll) => {
                const isActive = poll.isPublished && new Date(poll.expiresAt) > new Date();
                const isDraft = !poll.isPublished;
                const isClosed = poll.isPublished && new Date(poll.expiresAt) <= new Date();

                return (
                  <div key={poll.id} className={`bg-white border p-8 shadow-sm flex flex-col gap-4 ${isClosed ? 'opacity-75 border-gray-100' : isActive ? 'border-red-100' : 'border-gray-100'}`}>
                    <div className={`flex items-center gap-4 text-xs font-bold tracking-widest uppercase ${isActive ? 'text-brand-crimson' : 'text-gray-400'}`}>
                      {isActive && <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-crimson"></div> ACTIVE</span>}
                      {isDraft && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full border border-gray-500"></div> DRAFT</span>}
                      {isClosed && <span className="flex items-center gap-1.5">× CLOSED</span>}
                      <span className="text-gray-300">{new Date(poll.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <h3 className={`text-2xl font-${isActive ? 'semibold' : 'medium'} text-gray-900 w-3/4 leading-tight`}>{poll.title}</h3>
                      <div className="flex items-center gap-4">
                        {isDraft ? (
                          <button className="bg-brand-crimson text-white hover:bg-brand-crimson-hover text-xs font-bold tracking-widest uppercase px-6 py-2 transition-colors">EDIT</button>
                        ) : isClosed ? (
                          <Link to={`/p/${poll.slug}/results`} className="border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-bold tracking-widest uppercase px-4 py-2 transition-colors">RESULTS</Link>
                        ) : (
                          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${poll.slug}`) }} className="border border-brand-crimson/30 text-gray-700 hover:bg-gray-50 text-xs font-bold tracking-widest uppercase px-4 py-2 transition-colors">COPY</button>
                        )}
                        {!isClosed && <button className="text-gray-400 hover:text-gray-900">•••</button>}
                      </div>
                    </div>
                    {isActive && (
                       <div className="flex items-center gap-8 text-sm text-gray-600 mt-2 font-medium">
                         <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-gray-600"></div> -- votes</span>
                       </div>
                    )}
                  </div>
                );
              })}

            </>
          )}
        </div>
        
        <div className="flex justify-center mt-6 border-t border-brand-crimson/10 pt-8">
          <button className="text-sm font-bold tracking-widest uppercase text-brand-crimson border-b-2 border-brand-crimson pb-0.5 hover:text-brand-crimson-hover hover:border-brand-crimson-hover transition-colors">LOAD MORE</button>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
