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
    <section className="w-full py-16 sm:py-24 bg-brand-cream/50 border-t border-gray-100 relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-12">
          <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase">
            Built for everyone
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Everything you need,{" "}
            <span className="text-brand-crimson">nothing you don't</span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl leading-relaxed">
            Powerful controls for creators. Dead simple for voters.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 bg-white border border-gray-100 hover:border-brand-crimson/30 p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
                {f.emoji}
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-gray-900 text-base">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
