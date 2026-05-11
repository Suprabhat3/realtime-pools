import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

const Header = () => {
  const { isAuthenticated, user, signOut } = useAuth();

  const onSignOut = async () => {
    await signOut();
  };

  return (
    <header className="w-full flex justify-between items-center py-4 px-8 md:px-12 relative z-20 border-b border-gray-200">
      <Link to="/" className="flex items-center pl-2 md:pl-8">
        <img src="/favicon.png" alt="ZenPoll Logo" className="h-10 w-16" />
        <h3 className="text-xl font-bold text-gray-800 ml-2">ZenPoll</h3>
      </Link>

      <nav className="flex items-center gap-3 md:gap-6 text-sm font-semibold text-gray-600">
        <NavLink to="/" className="hover:text-gray-900 transition-colors">
          Home
        </NavLink>

        {isAuthenticated ? (
          <>
            <span className="hidden md:inline text-gray-500">{user?.email ?? "Signed in"}</span>
            <NavLink to="/profile" className="hover:text-gray-900 transition-colors">
              Profile
            </NavLink>
            <a
              href="/dashboard"
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-4 py-2.5 font-bold rounded-none shadow hover:-translate-y-0.5 transition-transform"
            >
              Dashboard
            </a>
            <button
              type="button"
              onClick={onSignOut}
              className="border border-gray-300 text-gray-800 px-4 py-2.5 font-bold rounded-none hover:bg-gray-100 transition-colors"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/signin" className="hover:text-gray-900 transition-colors">
              Log in
            </NavLink>
            <NavLink
              to="/signup"
              className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-4 py-2.5 font-bold rounded-none shadow hover:-translate-y-0.5 transition-transform"
            >
              Get started
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
