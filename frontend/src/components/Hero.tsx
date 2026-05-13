import { Link } from "react-router-dom";

const stats = [
  { value: "Real-time", label: "Live results" },
  { value: "Anonymous", label: "or auth voting" },
  { value: "Any device", label: "Mobile ready" },
];

const Hero = () => {
  return (
    <main className="grow flex items-center relative z-10 w-full">
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 md:py-24">
        <div className="flex w-full flex-col lg:flex-row justify-between items-center gap-10 lg:gap-16">

          {/* ── Left column: copy + CTAs ────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white border border-red-100 rounded-full px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-crimson animate-pulse shrink-0" />
              <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase">
                Opinion polling, redefined
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight text-gray-900">
              Your{" "}
              <span className="relative inline-block">
                Opinion,
                {/* underline accent */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 12"
                  className="absolute -bottom-1 left-0 w-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9 Q55 2 110 8 Q165 14 218 5"
                    stroke="#c91e3e"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              <br className="hidden sm:block" />
              <span className="text-brand-crimson">Amplified.</span>
            </h1>

            {/* Sub-copy */}
            <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-md">
              Create polls in seconds, share them anywhere, and watch real-time
              results pour in — with full control over privacy and who can vote.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2">
              <Link
                to="/explorer"
                className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-brand-crimson hover:bg-brand-crimson-hover text-white px-7 py-4 font-bold text-sm tracking-wide shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
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

              <Link
                to="/create"
                className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white border-2 border-brand-crimson text-brand-crimson hover:bg-red-50 px-7 py-4 font-bold text-sm tracking-wide transition-all duration-200 hover:-translate-y-0.5"
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
            </div>

            {/* Trust stats */}
            <div className="flex items-center gap-6 sm:gap-8 pt-4 border-t border-gray-100 w-full justify-center lg:justify-start flex-wrap">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center lg:items-start">
                  <span className="text-sm font-extrabold text-gray-900 tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: visual ────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex justify-center items-center relative">

            {/* Decorative ring */}
            <div
              aria-hidden="true"
              className="absolute inset-0 m-auto w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-brand-cream-dark/40 blur-2xl pointer-events-none"
            />

            {/* Mock poll card */}
            <div className="relative w-full max-w-sm sm:max-w-md bg-white border border-red-100 shadow-xl rounded-xl overflow-hidden">
              {/* Card header */}
              <div className="bg-brand-crimson px-6 py-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                </div>
                <span className="text-white text-xs font-bold tracking-widest uppercase ml-1 opacity-80">
                  Live Poll
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-xs font-bold">LIVE</span>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-5 flex flex-col gap-4">
                <p className="font-bold text-gray-900 text-base leading-snug">
                  What's the biggest challenge in software development today?
                </p>

                {/* Options with animated bars */}
                {[
                  { label: "AI replacing developers", pct: 42 },
                  { label: "Keeping up with new tech", pct: 31 },
                  { label: "Work-life balance", pct: 19 },
                  { label: "Remote collaboration", pct: 8 },
                ].map((opt, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>{opt.label}</span>
                      <span className="text-brand-crimson">{opt.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-crimson/70 rounded-full"
                        style={{ width: `${opt.pct}%`, transition: "width 1.2s ease" }}
                      />
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-400 font-medium">
                  <span>2,847 votes</span>
                  <span>3 days left</span>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-3 -right-2 sm:right-4 bg-white border border-red-100 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold text-gray-800">
              <span className="text-lg leading-none">🎯</span>
              Anonymous voting
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Hero;
