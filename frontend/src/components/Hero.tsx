const Hero = () => {
  return (
    <main className="grow flex items-center relative z-10 w-full max-w-7xl mx-auto px-8 py-20">
      <div className="flex w-full justify-between items-center gap-16">
        {/* Left Column: Content */}
        <div className="w-1/2 flex relative ">
          {/* Vertical Japanese Text Decoration */}
          {/* <div
            aria-hidden="true"
            className="absolute left-0 top-12 text-xs text-gray-400 vertical-text"
          >
            リンク管理
          </div> */}
          
          <div className="flex flex-col gap-6 w-full max-w-lg">
            <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase">
              Opinion polling, redefined
            </span>
            <h1 className="text-7xl font-bold leading-[1.1] tracking-tight">
              Your <br />
              Opinion, <br />
              <span className="text-brand-crimson">Amplified</span>
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mt-4">
              Gather insights in under 5ms. Deep dive into trending topics.
              Build stunning visual polls. All from one dashboard.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="#"
                className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-4 font-bold rounded-none shadow-md hover:-translate-y-0.5 transition-transform"
              >
                Create a Poll
              </a>
              <a
                href="#"
                className="border border-gray-300 text-gray-800 px-8 py-4 font-bold rounded-none hover:bg-gray-100 transition-colors flex items-center gap-2 bg-transparent"
              >
                Explore Trends <span>→</span>
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              No credit card needed. Free forever plan.
            </p>
          </div>
        </div>

        {/* Right Column: Image/Artwork */}
        <div className="w-1/2 flex justify-center items-center relative z-20">
          {/* Transparent Blended Artwork without container */}
          <img
            src="/hero-image.png"
            alt="Artistic mountain landscape with a red sun, representing deep insights"
            className="w-[120%] max-w-none h-auto object-contain scale-110 transition-transform duration-700 hover:scale-[1.15]"
          />
        </div>
      </div>
    </main>
  );
};

export default Hero;
