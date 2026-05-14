const features = [
  {
    emoji: "🌍",
    title: "Public or Private",
    description:
      "Public polls appear on the Explorer feed for the world to discover. Private polls are accessible only via a direct link you share."
  },
  {
    emoji: "🔐",
    title: "Auth-required voting",
    description:
      "Require sign-in before voting to collect accountable responses — and display voter names alongside the results."
  },
  {
    emoji: "👤",
    title: "Anonymous by default",
    description:
      "No account? No problem. Anonymous voters are fingerprinted by browser so each person can only vote once."
  },
  {
    emoji: "🎯",
    title: "Vote cap auto-close",
    description:
      "Set a maximum number of votes. Once the cap is reached the poll closes automatically and results are revealed."
  },
  {
    emoji: "⏱️",
    title: "Flexible duration",
    description:
      "Choose from 1 day to 3 months — or enter a custom number of days. The poll expires automatically when time is up."
  },
  {
    emoji: "📊",
    title: "Real-time results",
    description:
      "Watch the percentage bars update live as votes pour in. No refresh needed — results stream via WebSocket."
  }
];

const Features = () => {
  return (
    <section className="w-full py-20 sm:py-32 bg-gray-50/50 border-t border-gray-100 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-20">
          <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase flex items-center gap-2 bg-brand-crimson/10 px-4 py-1.5 rounded-full">
            Built for everyone
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Everything you need, <br className="hidden sm:block" />
            <span className="text-brand-crimson">nothing you don't</span>
          </h2>
          <p className="text-gray-500 text-lg sm:text-xl max-w-2xl leading-relaxed mt-2">
            Powerful controls for creators. Dead simple for voters.
          </p>
        </div>

        {/* Highlighted Analytics Feature */}
        <div className="mb-8">
          <div className="group relative overflow-hidden bg-brand-crimson rounded-3xl p-8 sm:p-12 shadow-xl shadow-brand-crimson/20 flex flex-col md:flex-row items-center gap-8 md:gap-12 transition-transform duration-300 hover:-translate-y-1 border border-brand-crimson-hover">
            {/* Background decorative blobs */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors duration-500" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-black/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-5xl md:text-6xl border border-white/20 shadow-inner shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              📈
            </div>
            
            <div className="flex flex-col gap-3 text-center md:text-left relative z-10 flex-1">
              <span className="inline-block px-4 py-1.5 bg-white/20 text-white rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase self-center md:self-start backdrop-blur-sm border border-white/20 shadow-sm">
                Creator Exclusive
              </span>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white mt-2">Deep Demographic Analytics</h3>
              <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-3xl mt-1">
                Go beyond simple vote counts. Our advanced dashboard shares detailed user demographics—including age groups and gender distribution—exclusively with creators, empowering you to deeply understand exactly <strong>who</strong> is engaging with your polls and <strong>why</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="group flex flex-col gap-5 bg-white border-2 border-gray-100 hover:border-brand-crimson/20 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-cream border border-brand-crimson/10 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-brand-crimson/10 transition-all duration-300">
                {f.emoji}
              </div>
              <div className="flex flex-col gap-2.5">
                <h3 className="font-bold text-gray-900 text-xl group-hover:text-brand-crimson transition-colors">{f.title}</h3>
                <p className="text-gray-500 text-base leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
