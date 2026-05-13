import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll, publishPoll, type CreatePollInput } from "../lib/polls-api";

const CreatePollPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isPublic, setIsPublic] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleCopyLink = () => {
    if (!createdSlug) return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${createdSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      setError("Poll question is required.");
      return;
    }

    const validOptions = options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) {
      setError("At least two valid options are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: CreatePollInput = {
        title: title.trim(),
        description: category ? `Category: ${category}` : undefined,
        responseMode: requireAuth ? "AUTHENTICATED" : "ANONYMOUS",
        isPublic,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        questions: [
          {
            text: title.trim(),
            isRequired: true,
            options: validOptions.map((opt) => opt.trim())
          }
        ]
      };

      const res = await createPoll(payload);
      const slug: string = res.data.slug;
      setCreatedSlug(slug);

      if (publish) {
        await publishPoll(res.data.id);
      }

      // Stay on page to show the shareable link
    } catch (err: any) {
      setError(err.message || "Failed to create poll.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (createdSlug) {
    const shareUrl = `${window.location.origin}/p/${createdSlug}`;
    return (
      <div className="flex w-full justify-center">
        <div className="w-full max-w-2xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-400 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Poll Created!</h1>
          <p className="text-gray-500 mb-8">
            {isPublic
              ? "Your poll is live and visible on the Explorer page."
              : "Your poll is private. Share the link below with your audience."}
          </p>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden mb-6">
            <span className="flex-1 px-4 py-3 text-sm text-gray-600 text-left truncate">{shareUrl}</span>
            <button
              onClick={handleCopyLink}
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-5 py-3 text-sm font-bold tracking-wide transition-colors shrink-0"
            >
              {copied ? "COPIED!" : "COPY"}
            </button>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/p/${createdSlug}`)}
              className="border border-brand-crimson text-brand-crimson hover:bg-red-50 px-6 py-3 text-sm font-bold tracking-widest uppercase transition-colors"
            >
              VIEW POLL
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-6 py-3 text-sm font-bold tracking-widest uppercase transition-colors"
            >
              DASHBOARD
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Create form ─────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-2xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl">
        <div className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Create New Poll</h1>
          <p className="text-gray-600">Ask your audience anything. Keep it engaging.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

        <div className="flex flex-col gap-8">
          {/* Poll Question */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-900">Poll Question</label>
            <textarea
              placeholder="What do you want to ask?"
              className="w-full border border-red-100 rounded-lg p-4 h-32 resize-none focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-900">Category</label>
            <div className="relative">
              <select
                className="w-full border border-red-100 rounded-lg p-4 appearance-none focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800 bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" disabled>Select a category</option>
                <option value="Technology">Technology</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Business">Business</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Politics">Politics</option>
                <option value="Sports">Sports</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 mt-2">
            <label className="text-sm font-bold text-gray-900">Options</label>
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="text-gray-400 cursor-grab">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/>
                    <circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 border border-red-100 rounded-lg p-4 focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800"
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                <button
                  onClick={() => handleRemoveOption(index)}
                  disabled={options.length <= 2}
                  className="text-gray-400 hover:text-gray-900 p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}

            <button onClick={handleAddOption} className="flex items-center gap-2 text-sm font-bold text-gray-800 hover:text-brand-crimson transition-colors mt-2 w-fit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Option
            </button>
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 mt-2">
            <div>
              <label className="text-sm font-bold text-gray-900">Visibility</label>
              <p className="text-xs text-gray-500 mt-0.5">Control where your poll appears</p>
            </div>
            <div className="flex p-1 bg-gray-100 rounded-lg w-full">
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${isPublic ? "bg-white text-brand-crimson shadow-sm" : "text-gray-500"}`}
                onClick={() => setIsPublic(true)}
              >
                🌍 Public
              </button>
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${!isPublic ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                onClick={() => setIsPublic(false)}
              >
                🔒 Private
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {isPublic
                ? "Visible on the Explorer page. Anyone with the link can also vote."
                : "Only accessible via direct link — won't appear on Explorer."}
            </p>
          </div>

          {/* Who can vote */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 mt-2">
            <div>
              <label className="text-sm font-bold text-gray-900">Who can vote?</label>
              <p className="text-xs text-gray-500 mt-0.5">Control voter authentication</p>
            </div>
            <div className="flex p-1 bg-gray-100 rounded-lg w-full">
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${!requireAuth ? "bg-white text-brand-crimson shadow-sm" : "text-gray-500"}`}
                onClick={() => setRequireAuth(false)}
              >
                👤 Anyone
              </button>
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${requireAuth ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                onClick={() => setRequireAuth(true)}
              >
                🔐 Signed-in only
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {requireAuth
                ? "Only authenticated users can vote. Voter names will be shown on results."
                : "Anyone can vote anonymously. We use a browser fingerprint to prevent duplicate votes."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end items-center gap-6 pt-8 mt-4 border-t border-gray-100">
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={loading}
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-3.5 font-bold tracking-widest uppercase text-sm rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "SAVING..." : "PUBLISH"}
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePollPage;
