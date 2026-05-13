import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

const Header = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const onSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explorer?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="w-full flex justify-between items-center py-4 px-8 md:px-12 relative z-20 bg-white shadow-sm border-b border-gray-100">
      <div className="flex items-center gap-8 lg:gap-16">
        <Link to="/" className="flex items-center">
          <div className="h-6 w-6 rounded-full border-4 border-brand-crimson"></div>
          <h3 className="text-xl font-bold text-gray-900 ml-2 tracking-tight">VibePoll</h3>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-bold tracking-wide uppercase text-gray-600">
          <NavLink
            to="/explorer"
            className={({ isActive }) =>
              `hover:text-brand-crimson transition-colors pb-1 border-b-2 ${
                isActive ? "text-brand-crimson border-brand-crimson" : "border-transparent"
              }`
            }
          >
            Explorer
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) =>
              `hover:text-brand-crimson transition-colors pb-1 border-b-2 ${
                isActive ? "text-brand-crimson border-brand-crimson" : "border-transparent"
              }`
            }
          >
            Create
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `hover:text-brand-crimson transition-colors pb-1 border-b-2 ${
                  isActive ? "text-brand-crimson border-brand-crimson" : "border-transparent"
                }`
              }
            >
              Dashboard
            </NavLink>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <form onSubmit={handleSearch} className="hidden lg:flex items-center border-b border-gray-300 pb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-gray-400 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-48 text-gray-700 placeholder-gray-400"
          />
        </form>

        <div className="flex items-center gap-4 text-sm font-semibold">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={onSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log out
              </button>
              <Link to="/profile" className="block">
                <div className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                  {user?.name ? (
                    <div className="h-full w-full flex items-center justify-center bg-brand-crimson text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || "avatar"}`}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link to="/signin" className="text-gray-700 hover:text-gray-900 transition-colors">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-5 py-2 font-bold rounded shadow-sm transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
