import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <section className="w-full py-20 sm:py-28 bg-gray-900 relative z-10 overflow-hidden">
      {/* Background decorations */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-full h-full pointer-events-none select-none overflow-hidden"
      >
        {/* Big faint crimson ring top-right */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full border border-brand-crimson/10" />
        <div className="absolute -top-20 -right-20 w-[320px] h-[320px] rounded-full border border-brand-crimson/8" />
        {/* Glow bottom-left */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-crimson/6 rounded-full blur-3xl" />
        {/* Faint kanji */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 text-[20rem] font-serif text-white/[0.03] select-none leading-none">
          意
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 relative z-10 flex flex-col items-center text-center gap-8">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-brand-crimson/10 border border-brand-crimson/20 rounded-full px-4 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-crimson animate-pulse" />
          <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase">
            Your voice matters
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
          Share your opinion —
          <br />
          <span className="text-brand-crimson">because it matters.</span>
        </h2>

        {/* Sub-copy */}
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">
          Every vote shapes the conversation. Jump into a trending poll or start
          one of your own — it only takes a minute.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            to="/create"
            className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-4 font-bold text-sm tracking-wide shadow-lg hover:-translate-y-0.5 hover:shadow-brand-crimson/30 transition-all duration-200"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:rotate-90 transition-transform duration-300"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Your Poll
          </Link>

          <Link
            to="/explorer"
            className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-4 font-bold text-sm tracking-wide transition-all duration-200 hover:-translate-y-0.5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:scale-110 transition-transform"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Explore Polls
          </Link>
        </div>

        {/* Social proof row */}
        <div className="flex items-center gap-6 pt-4 flex-wrap justify-center">
          {[
            { label: "Anonymous voting" },
            { label: "Real-time results" },
            { label: "No credit card" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
