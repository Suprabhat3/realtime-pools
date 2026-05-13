import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll, publishPoll, type CreatePollInput } from "../lib/polls-api";

const CreatePollPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
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
        responseMode: "ANONYMOUS", // Based on UI, there's no auth setting, just Privacy (which we map to Public/Private feed, not responseMode)
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
        questions: [
          {
            text: title.trim(),
            isRequired: true,
            options: validOptions.map((opt) => opt.trim())
          }
        ]
      };

      const res = await createPoll(payload);
      
      if (publish) {
        await publishPoll(res.data.id);
        navigate("/dashboard"); // or to the poll details
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create poll.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-2xl bg-white border border-red-50 p-8 md:p-12 shadow-sm rounded-xl">
        <div className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Create New Poll</h1>
          <p className="text-gray-600">Ask your audience anything. Keep it engaging.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-900">Poll Question</label>
            <textarea
              placeholder="What do you want to ask?"
              className="w-full border border-red-100 rounded-lg p-4 h-32 resize-none focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

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
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 mt-2">
            <label className="text-sm font-bold text-gray-900">Options</label>
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="text-gray-400 cursor-grab">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 border border-red-100 rounded-lg p-4 focus:outline-none focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-gray-800"
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                <button onClick={() => handleRemoveOption(index)} className="text-gray-400 hover:text-gray-900 p-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
            
            <button onClick={handleAddOption} className="flex items-center gap-2 text-sm font-bold text-gray-800 hover:text-brand-crimson transition-colors mt-2 w-fit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Option
            </button>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 mt-2">
            <label className="text-sm font-bold text-gray-900">Privacy Settings</label>
            <div className="flex p-1 bg-gray-100 rounded-lg w-full">
              <button 
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${!isPrivate ? 'bg-white text-brand-crimson shadow-sm' : 'text-gray-500'}`}
                onClick={() => setIsPrivate(false)}
              >
                Public
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-bold rounded-md transition-colors ${isPrivate ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                onClick={() => setIsPrivate(true)}
              >
                Private
              </button>
            </div>
            <p className="text-xs font-bold text-gray-900 tracking-wide mt-1">
              {isPrivate ? "Private polls only visible via direct link." : "Public polls appear on the Explorer feed."}
            </p>
          </div>

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
              {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreatePollPage;
