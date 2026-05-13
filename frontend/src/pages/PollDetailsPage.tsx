import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicPoll, getPublicPollResults, submitPublicResponse } from "../lib/polls-api";

const PollDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [poll, setPoll] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (slug) {
      getPublicPoll(slug)
        .then((res) => {
          setPoll(res.data);
          // Try to fetch results as well, it might throw if not published or if user hasn't voted
          return getPublicPollResults(slug).catch(() => null);
        })
        .then((res) => {
          if (res) setResults(res.data);
        })
        .catch((err) => {
          setError(err.message || "Failed to load poll.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [slug]);

  const handleSubmitVote = async () => {
    if (!selectedOption || !poll || !slug) return;
    setVoting(true);
    try {
      const answers = [{ questionId: poll.questions[0].id, optionId: selectedOption }];
      await submitPublicResponse(slug, answers, true); // submit as anonymous for now
      
      // Fetch updated results
      const res = await getPublicPollResults(slug);
      setResults(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to submit vote.");
    } finally {
      setVoting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading poll...</div>;
  }

  if (error || !poll) {
    return <div className="p-12 text-center text-red-600">{error || "Poll not found"}</div>;
  }

  const question = poll.questions[0];
  const hasVoted = !!results; // Assuming if we have results, the user can see them (or maybe it's published)

  return (
    <div className="flex flex-col lg:flex-row w-full gap-16 text-gray-900 mt-4">
      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-12 max-w-3xl">
        <div className="flex flex-col gap-6 border-b border-gray-100 pb-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-500">
            <span>EXPLORER</span> <span className="text-gray-300">/</span>
            <span>TECHNOLOGY</span> <span className="text-gray-300">/</span>
            <span className="text-gray-900">ACTIVE POLL</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-brand-crimson">
            <div className="w-2 h-2 rounded-full bg-brand-crimson"></div>
            LIVE
          </div>

          <div className="flex gap-6 items-start mt-2">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Elena" alt="Creator" className="w-16 h-16 bg-gray-200" />
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-crimson leading-tight">
                {poll.title}
              </h1>
              <p className="text-sm font-medium text-gray-600">
                Asked {poll.creator?.name ? `by ${poll.creator.name}` : "anonymously"} • {new Date(poll.createdAt).toLocaleDateString()} • <span className="font-bold text-gray-900">{results?.overview?.totalResponses || 0} votes</span>
              </p>
            </div>
          </div>
        </div>

        {/* Voting Options */}
        <div className="flex flex-col gap-4">
          {question.options.map((option: any) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              disabled={hasVoted}
              className={`flex items-center gap-4 p-6 border transition-colors text-left ${
                selectedOption === option.id 
                  ? 'border-brand-crimson bg-red-50/20 text-brand-crimson' 
                  : 'border-red-100 text-brand-crimson hover:bg-red-50/10'
              }`}
            >
              <div className={`w-6 h-6 border flex items-center justify-center ${
                selectedOption === option.id ? 'border-brand-crimson' : 'border-red-200'
              }`}>
                {selectedOption === option.id && <div className="w-3 h-3 bg-brand-crimson"></div>}
              </div>
              <span className="text-xl font-bold">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center py-4 border-b border-gray-100">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400">VOTING ENDS IN 2 DAYS</span>
          <button 
            onClick={handleSubmitVote}
            disabled={!selectedOption || hasVoted || voting}
            className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-3.5 font-bold tracking-widest uppercase text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {voting ? "SUBMITTING..." : "SUBMIT VOTE"}
            {!voting && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
          </button>
        </div>

        {/* Results Section (Show if voted or published results) */}
        {hasVoted && results && (
          <div className="flex flex-col gap-8 mt-4 pb-12">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-brand-crimson tracking-tight">Current Results</h2>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-500">LIVE STATISTICS</span>
            </div>

            <div className="flex flex-col gap-6">
              {results.questions[0].options.map((opt: any) => (
                <div key={opt.optionId} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-4 z-10 relative">
                    <span className="text-lg font-bold text-brand-crimson">{opt.optionLabel}</span>
                    <span className="text-lg font-bold text-brand-crimson">{opt.percentage}%</span>
                  </div>
                  <div className="h-14 bg-transparent border-l-2 border-brand-crimson/20 relative -mt-10 overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gray-200/50" 
                      style={{ width: `${opt.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-80 flex flex-col gap-12 shrink-0">
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold tracking-widest uppercase text-brand-crimson">SHARE</h3>
          <div className="flex">
            <input 
              type="text" 
              readOnly 
              value={`vibepoll.co/p/${slug}`} 
              className="flex-1 bg-white border border-gray-200 border-r-0 p-3 text-sm text-gray-600 focus:outline-none"
            />
            <button onClick={copyLink} className="bg-brand-crimson hover:bg-brand-crimson-hover text-white p-3 flex items-center justify-center transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          <div className="flex gap-4">
            <button className="w-12 h-12 border border-red-100 flex items-center justify-center text-brand-crimson hover:bg-red-50 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </button>
            <button className="w-12 h-12 border border-red-100 flex items-center justify-center text-brand-crimson hover:bg-red-50 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </button>
            <button className="w-12 h-12 border border-red-100 flex items-center justify-center text-brand-crimson hover:bg-red-50 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 pt-8 border-t border-gray-100">
          <h3 className="text-xs font-bold tracking-widest uppercase text-brand-crimson mb-2">STATISTICS</h3>
          
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-gray-600 font-medium">Total Votes</span>
            <span className="text-2xl font-bold text-brand-crimson">{results?.overview?.totalResponses || 0}</span>
          </div>
          
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-gray-600 font-medium">Engagement</span>
            <span className="text-2xl font-bold text-brand-crimson">--</span>
          </div>
          
          <div className="flex justify-between items-center pb-4">
            <span className="text-gray-600 font-medium">Demographics</span>
            <span className="text-base font-bold text-brand-crimson">--</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default PollDetailsPage;
