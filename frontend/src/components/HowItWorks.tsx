const steps = [
  {
    number: "01",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    <section className="w-full py-20 sm:py-32 bg-white relative z-10 overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-20">
          <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase flex items-center gap-2 bg-brand-crimson/10 px-4 py-1.5 rounded-full">
            Simple by design
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            How it works
          </h2>
          <p className="text-gray-500 text-lg sm:text-xl max-w-2xl leading-relaxed mt-2">
            From idea to insights in under a minute. No friction, just results.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 relative">
          {/* Connector line (desktop only) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-brand-crimson/30 to-transparent"
          />

          {steps.map((step, i) => (
            <div
              key={i}
              className="group flex flex-col items-center text-center gap-6 relative"
            >
              {/* Number + icon combo */}
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-3xl bg-brand-cream border border-brand-crimson/10 flex items-center justify-center text-brand-crimson shadow-sm group-hover:shadow-xl group-hover:shadow-brand-crimson/10 group-hover:border-brand-crimson/20 transition-all duration-300 transform group-hover:-translate-y-2">
                  {step.icon}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-crimson text-white flex items-center justify-center shadow-md">
                  <span className="text-[12px] font-extrabold">{i + 1}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 mt-2">
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Step {step.number}</span>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-brand-crimson transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-base leading-relaxed max-w-[18rem]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
