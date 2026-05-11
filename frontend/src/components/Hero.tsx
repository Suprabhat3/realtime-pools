import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <main className="grow flex items-center relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
      <div className="flex w-full flex-col-reverse lg:flex-row justify-between items-center gap-12 lg:gap-16">
        <div className="w-full lg:w-1/2 flex relative">
          <div className="flex flex-col gap-6 w-full max-w-lg">
            <span className="text-brand-crimson font-bold text-xs tracking-widest uppercase">
              Opinion polling, redefined
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
              Your <br />
              Opinion, <br />
              <span className="text-brand-crimson">Amplified</span>
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mt-2">
              Gather insights quickly, collect authentic feedback, and publish meaningful results from one platform.
            </p>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <Link
                to="/signup"
                className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-8 py-4 font-bold rounded-none shadow-md hover:-translate-y-0.5 transition-transform"
              >
                Create Account
              </Link>
              <Link
                to="/signin"
                className="border border-gray-300 text-gray-800 px-8 py-4 font-bold rounded-none hover:bg-gray-100 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex justify-center items-center relative z-20">
          <img
            src="/hero-image.png"
            alt="Artistic mountain landscape with a red sun"
            className="w-[110%] max-w-none h-auto object-contain scale-105 transition-transform duration-700 hover:scale-110"
          />
        </div>
      </div>
    </main>
  );
};

export default Hero;
