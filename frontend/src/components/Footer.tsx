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
          © 2024 ZenPoll. Built for active transparency.
        </span>
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
    </footer>
  );
};

export default Footer;
