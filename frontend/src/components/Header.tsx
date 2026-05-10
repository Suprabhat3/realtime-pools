const Header = () => {
  return (
    <header className="w-full flex justify-between items-center py-4 px-12 relative z-20 border-b border-gray-200">
      {/* Logo */}
      <div className="flex items-center pl-16">
      <img src="/favicon.png" alt="ZenPoll Logo" className="h-10 w-16" />
      <h3 className="text-xl font-bold text-gray-800 ml-2">ZenPoll</h3>
      </div>

      {/* Navigation & Actions */}
      <nav className="flex items-center gap-8 text-sm font-semibold text-gray-600">
        <a href="#" className="hover:text-gray-900 transition-colors">
          Pricing
        </a>
        <button
          aria-label="Toggle theme"
          className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
            />
          </svg>
        </button>
        <a href="#" className="hover:text-gray-900 transition-colors">
          Log in
        </a>
        <a
          href="#"
          className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-5 py-2.5 font-bold rounded-none shadow hover:-translate-y-0.5 transition-transform"
        >
          Get started
        </a>
      </nav>
    </header>
  );
};

export default Header;
