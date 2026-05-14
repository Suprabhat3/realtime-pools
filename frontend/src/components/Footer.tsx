import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full py-8 px-8 md:px-12 bg-white border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-semibold text-gray-500 mt-auto relative z-10">
      <div className="flex items-center">
        <div className="h-4 w-4 rounded-full border-[3px] border-brand-crimson mr-2"></div>
        <span className="text-gray-900 font-bold text-lg tracking-tight">
          ZenPoll
        </span>
        <span className="ml-4 font-normal">
          © 2026 ZenPoll. Built for active transparency.
        </span>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6 mt-4 md:mt-0">
        <div className="flex items-center gap-4 border-r-0 md:border-r border-gray-200 pr-0 md:pr-6">
          <a href="https://x.com/suprabhat_3" target="_blank" className="text-gray-400 hover:text-brand-crimson transition-colors" aria-label="Twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
            </svg>
          </a>
          <a href="https://github.com/suprabhat3" target="_blank" className="text-gray-400 hover:text-brand-crimson transition-colors" aria-label="GitHub">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>
          <a href="https://new.suprabhat.site" target="_blank" className="text-gray-400 hover:text-brand-crimson transition-colors" aria-label="Portfolio">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <path d="M2 12h20"></path>
            </svg>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <Link
            to="/privacy"
            className="hover:text-gray-900 transition-colors uppercase tracking-wider text-xs"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="hover:text-gray-900 transition-colors uppercase tracking-wider text-xs"
          >
            Terms
          </Link>
          <Link
            to="/help"
            className="hover:text-gray-900 transition-colors uppercase tracking-wider text-xs"
          >
            Help
          </Link>
          <Link
            to="/contact"
            className="hover:text-gray-900 transition-colors uppercase tracking-wider text-xs"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
