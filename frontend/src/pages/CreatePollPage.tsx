import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll, type CreatePollInput } from "../lib/polls-api";

type DraftQuestion = {
  text: string;
  isRequired: boolean;
  options: string[];
};

const DURATION_OPTIONS = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "1 month", hours: 720 },
  { label: "3 months", hours: 2160 },
  { label: "Custom", hours: 0 }
];

const createEmptyQuestion = (): DraftQuestion => ({
  text: "",
  isRequired: true,
  options: ["", ""]
});

const CreatePollPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([createEmptyQuestion()]);

  const [isPublic, setIsPublic] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);

  const [selectedDuration, setSelectedDuration] = useState(168);
  const [customDays, setCustomDays] = useState("7");
  const [isCustom, setIsCustom] = useState(false);

  const [enableMaxVotes, setEnableMaxVotes] = useState(false);
  const [maxVotes, setMaxVotes] = useState("100");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDurationSelect = (hours: number) => {
    if (hours === 0) {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    setSelectedDuration(hours);
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

  const setQuestion = (index: number, updater: (prev: DraftQuestion) => DraftQuestion) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updater(q) : q)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, createEmptyQuestion()]);

  const removeQuestion = (index: number) => {
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const addOption = (questionIndex: number) => {
    setQuestion(questionIndex, (q) => ({ ...q, options: [...q.options, ""] }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestion(questionIndex, (q) => ({
      ...q,
      options: q.options.length > 2 ? q.options.filter((_, i) => i !== optionIndex) : q.options
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Poll title is required.");
      return;
    }

    const normalizedQuestions = questions.map((q) => ({
      text: q.text.trim(),
      isRequired: q.isRequired,
      options: q.options.map((o) => o.trim()).filter((o) => o.length > 0)
    }));

    if (normalizedQuestions.length < 1) {
      setError("At least one question is required.");
      return;
    }

    const invalidQuestionIndex = normalizedQuestions.findIndex(
      (q) => q.text.length < 2 || q.options.length < 2
    );

    if (invalidQuestionIndex >= 0) {
      setError(`Question ${invalidQuestionIndex + 1} needs text and at least two options.`);
      return;
    }

    if (enableMaxVotes && parseInt(maxVotes, 10) < 2) {
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
        questions: normalizedQuestions
      };

      const res = await createPoll(payload);
      setCreatedSlug(res.data.slug);
    } catch (err: any) {
      setError(err.message || "Failed to create poll.");
    } finally {
      setLoading(false);
    }
  };

  if (createdSlug) {
    const shareUrl = `${window.location.origin}/p/${createdSlug}`;
    return (
      <div className="flex w-full justify-center">
        <div className="w-full max-w-2xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Poll is Live!</h1>
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
              {copied ? "COPIED" : "COPY"}
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

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Create New Poll</h1>
        <p className="text-gray-600 mb-8">Create polls with multiple single-choice questions.</p>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-900">Poll Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-red-100 rounded-lg p-4"
              placeholder="Enter a poll title"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-900">Category</label>
            <select
              className="w-full border border-red-100 rounded-lg p-4 bg-white"
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
          </div>

          <div className="border-t border-gray-100 pt-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="text-sm font-bold text-brand-crimson"
              >
                + Add Question
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="border border-gray-100 rounded-lg p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">Question {qIndex + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    disabled={questions.length <= 1}
                    className="text-xs font-bold text-red-500 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>

                <textarea
                  value={q.text}
                  onChange={(e) => setQuestion(qIndex, (prev) => ({ ...prev, text: e.target.value }))}
                  className="w-full border border-red-100 rounded-lg p-3 h-24 resize-none"
                  placeholder="Enter question text"
                />

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={q.isRequired}
                    onChange={(e) =>
                      setQuestion(qIndex, (prev) => ({ ...prev, isRequired: e.target.checked }))
                    }
                  />
                  Required question
                </label>

                <div className="flex flex-col gap-3">
                  {q.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          setQuestion(qIndex, (prev) => ({
                            ...prev,
                            options: prev.options.map((o, i) => (i === optionIndex ? e.target.value : o))
                          }))
                        }
                        className="flex-1 border border-red-100 rounded-lg p-3"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, optionIndex)}
                        disabled={q.options.length <= 2}
                        className="text-red-500 text-xs font-bold disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="w-fit text-sm font-bold text-gray-700"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <label className="text-sm font-bold text-gray-900">Poll Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const active = opt.hours === 0 ? isCustom : (!isCustom && selectedDuration === opt.hours);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleDurationSelect(opt.hours)}
                    className={`py-2.5 px-3 text-sm font-semibold border rounded-lg ${
                      active
                        ? "bg-brand-crimson text-white border-brand-crimson"
                        : "bg-white text-gray-600 border-gray-200"
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
                  className="w-28 border border-red-100 rounded-lg p-3 text-center"
                />
                <span className="text-sm text-gray-600 font-medium">days</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <div className="flex items-start justify-between gap-4">
              <label className="text-sm font-bold text-gray-900">Vote Cap</label>
              <button
                type="button"
                onClick={() => setEnableMaxVotes(!enableMaxVotes)}
                className={`relative shrink-0 w-12 h-6 rounded-full ${enableMaxVotes ? "bg-brand-crimson" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full ${enableMaxVotes ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            {enableMaxVotes && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="2"
                  value={maxVotes}
                  onChange={(e) => setMaxVotes(e.target.value)}
                  className="w-32 border border-red-100 rounded-lg p-3 text-center"
                />
                <span className="text-sm text-gray-600 font-medium">max votes</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <label className="text-sm font-bold text-gray-900">Visibility</label>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-bold rounded-md ${isPublic ? "bg-white text-brand-crimson" : "text-gray-500"}`}
                onClick={() => setIsPublic(true)}
              >
                Public
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-bold rounded-md ${!isPublic ? "bg-white text-gray-900" : "text-gray-500"}`}
                onClick={() => setIsPublic(false)}
              >
                Private
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
            <label className="text-sm font-bold text-gray-900">Who can vote?</label>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-bold rounded-md ${!requireAuth ? "bg-white text-brand-crimson" : "text-gray-500"}`}
                onClick={() => setRequireAuth(false)}
              >
                Anyone
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-bold rounded-md ${requireAuth ? "bg-white text-gray-900" : "text-gray-500"}`}
                onClick={() => setRequireAuth(true)}
              >
                Signed-in only
              </button>
            </div>
          </div>

          <div className="flex justify-end items-center gap-6 pt-8 mt-4 border-t border-gray-100">
            <button onClick={() => navigate(-1)} className="text-sm font-bold text-gray-500">Cancel</button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-3.5 font-bold tracking-widest uppercase text-sm rounded-md disabled:opacity-50"
            >
              {loading ? "CREATING..." : "CREATE POLL"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePollPage;
