const steps = [
  {
    number: "01",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Craft your question",
    description:
      "Write any question, add answer options, pick a duration (1 day to 3 months), and optionally set a vote cap that auto-closes the poll."
  },
  {
    number: "02",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
    title: "Share everywhere",
    description:
      "Every poll gets a unique shareable link. Keep it private and share only with your inner circle, or make it public for the Explorer feed."
  },
  {
    number: "03",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Watch results live",
    description:
      "Results update in real-time as votes come in. For authenticated polls, see exactly who voted. Anonymous polls show totals only."
  }
];

const HowItWorks = () => {
  return (
    <section className="w-full py-16 sm:py-24 bg-white border-t border-gray-100 relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-14">
          <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase">
            Simple by design
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            How it works
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl leading-relaxed">
            From idea to insights in under a minute.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-transparent via-brand-crimson/20 to-transparent"
          />

          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-center md:items-start text-center md:text-left gap-5 relative"
            >
              {/* Number + icon combo */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-brand-cream border border-red-100 flex items-center justify-center text-brand-crimson shadow-sm">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-crimson flex items-center justify-center">
                  <span className="text-white text-[10px] font-extrabold">{i + 1}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-300 tracking-widest">{step.number}</span>
                <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
