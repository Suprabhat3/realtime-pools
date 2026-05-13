import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll, type CreatePollInput } from "../lib/polls-api";

const DURATION_OPTIONS = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "1 month", hours: 720 },
  { label: "3 months", hours: 2160 },
  { label: "Custom", hours: 0 }
];

const CreatePollPage = () => {
  const navigate = useNavigate();

  // Core fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [options, setOptions] = useState(["", ""]);

  // Settings
  const [isPublic, setIsPublic] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);

  // Duration
  const [selectedDuration, setSelectedDuration] = useState(168); // default 7 days
  const [customDays, setCustomDays] = useState("7");
  const [isCustom, setIsCustom] = useState(false);

  // Max responses
  const [enableMaxVotes, setEnableMaxVotes] = useState(false);
  const [maxVotes, setMaxVotes] = useState("100");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddOption = () => setOptions([...options, ""]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleDurationSelect = (hours: number) => {
    if (hours === 0) {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setSelectedDuration(hours);
    }
  };

  const getExpiresAt = (): string => {
    const hours = isCustom ? Math.max(1, parseInt(customDays, 10) || 1) * 24 : selectedDuration;
    return new Date(Date.now() + hours * 3600000).toISOString();
  };

  const handleCopyLink = () => {
    if (!createdSlug) return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${createdSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("Poll question is required."); return; }

    const validOptions = options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) { setError("At least two valid options are required."); return; }

    if (enableMaxVotes && (parseInt(maxVotes, 10) < 2)) {
      setError("Max votes must be at least 2.");
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
        expiresAt: getExpiresAt(),
        ...(enableMaxVotes ? { maxResponses: parseInt(maxVotes, 10) } : {}),
        questions: [
          {
            text: title.trim(),
            isRequired: true,
            options: validOptions.map((opt) => opt.trim())
          }
        ]
      };

      const res = await createPoll(payload);
      setCreatedSlug(res.data.slug);
    } catch (err: any) {
      setError(err.message || "Failed to create poll.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Poll is Live! 🎉</h1>
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
              {copied ? "COPIED ✓" : "COPY"}
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

  // ── Create form ────────────────────────────────────────────────────────────
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
                <option>Technology</option>
                <option>Lifestyle</option>
                <option>Business</option>
                <option>Entertainment</option>
                <option>Politics</option>
                <option>Sports</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <label className="text-sm font-bold text-gray-900">Answer Options</label>
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="text-gray-400 cursor-grab">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                    <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
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
                  className="text-gray-400 hover:text-red-500 p-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
            <button onClick={handleAddOption} className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-brand-crimson transition-colors mt-1 w-fit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Option
            </button>
          </div>

          {/* Duration picker */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <div>
              <label className="text-sm font-bold text-gray-900">Poll Duration</label>
              <p className="text-xs text-gray-400 mt-0.5">How long should voting be open?</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const active = opt.hours === 0 ? isCustom : (!isCustom && selectedDuration === opt.hours);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleDurationSelect(opt.hours)}
                    className={`py-2.5 px-3 text-sm font-semibold border rounded-lg transition-colors ${
                      active
                        ? "bg-brand-crimson text-white border-brand-crimson"
                        : "bg-white text-gray-600 border-gray-200 hover:border-brand-crimson hover:text-brand-crimson"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {isCustom && (
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-28 border border-red-100 rounded-lg p-3 focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800 text-center"
                />
                <span className="text-sm text-gray-600 font-medium">days</span>
              </div>
            )}
          </div>

          {/* Max votes cap */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <label className="text-sm font-bold text-gray-900">Vote Cap</label>
                <p className="text-xs text-gray-400 mt-0.5">Auto-close when a certain number of votes is reached</p>
              </div>
              <button
                type="button"
                onClick={() => setEnableMaxVotes(!enableMaxVotes)}
                className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${enableMaxVotes ? "bg-brand-crimson" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enableMaxVotes ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            {enableMaxVotes && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="2"
                  value={maxVotes}
                  onChange={(e) => setMaxVotes(e.target.value)}
                  className="w-32 border border-red-100 rounded-lg p-3 focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800 text-center"
                />
                <span className="text-sm text-gray-600 font-medium">max votes, then auto-close</span>
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <div>
              <label className="text-sm font-bold text-gray-900">Visibility</label>
              <p className="text-xs text-gray-400 mt-0.5">Control where your poll appears</p>
            </div>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${isPublic ? "bg-white text-brand-crimson shadow-sm" : "text-gray-500"}`}
                onClick={() => setIsPublic(true)}
              >
                🌍 Public
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${!isPublic ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                onClick={() => setIsPublic(false)}
              >
                🔒 Private
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {isPublic
                ? "Visible on the Explorer page. Anyone with the link can also vote."
                : "Only accessible via direct link — won't appear on Explorer."}
            </p>
          </div>

          {/* Who can vote */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <div>
              <label className="text-sm font-bold text-gray-900">Who can vote?</label>
              <p className="text-xs text-gray-400 mt-0.5">Authentication requirement for voters</p>
            </div>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${!requireAuth ? "bg-white text-brand-crimson shadow-sm" : "text-gray-500"}`}
                onClick={() => setRequireAuth(false)}
              >
                👤 Anyone
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${requireAuth ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                onClick={() => setRequireAuth(true)}
              >
                🔐 Signed-in only
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {requireAuth
                ? "Only authenticated users can vote. Voter names will be shown in results."
                : "Anyone can vote anonymously. Browser fingerprint prevents duplicate votes."}
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end items-center gap-6 pt-8 mt-4 border-t border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-3.5 font-bold tracking-widest uppercase text-sm rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "CREATING..." : "CREATE POLL"}
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
