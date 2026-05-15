import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useState, useRef, useEffect } from "react";

const Header = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header ref={headerRef} className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-12 relative z-10">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center group" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/zenpoll-logo.png" alt="Logo" className="h-10 w-14 transition-transform duration-300 group-hover:scale-105" />
          </Link>
        </div>

        {/* Navigation - Centered Desktop */}
        <nav className="hidden md:flex items-center justify-center gap-10 text-sm font-bold tracking-wider uppercase text-gray-600">
          <NavLink
            to="/explorer"
            className={({ isActive }) =>
              `relative group py-1 transition-colors hover:text-brand-crimson ${
                isActive ? "text-brand-crimson" : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                Explorer
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand-crimson transition-transform duration-300 origin-left ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) =>
              `relative group py-1 transition-colors hover:text-brand-crimson ${
                isActive ? "text-brand-crimson" : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                Create
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand-crimson transition-transform duration-300 origin-left ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </>
            )}
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `relative group py-1 transition-colors hover:text-brand-crimson ${
                  isActive ? "text-brand-crimson" : ""
                }`
              }
            >
              {({ isActive }) => (
                <>
                  Dashboard
                  <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand-crimson transition-transform duration-300 origin-left ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* Auth / Profile - Right side */}
        <div className="flex items-center gap-3 sm:gap-5 text-sm font-semibold relative">
          <div ref={dropdownRef} className="flex items-center gap-3 sm:gap-5 relative">
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="block transform hover:scale-105 transition-transform duration-200 focus:outline-none"
              >
                <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm ring-2 ring-transparent hover:ring-brand-crimson/30 transition-all">
                  {user?.name ? (
                    <div className="h-full w-full flex items-center justify-center bg-brand-crimson text-white font-bold text-lg">
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
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-14 right-0 w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 transition-all">
                  <Link 
                    to="/profile" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-brand-crimson transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Profile
                  </Link>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onSignOut();
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Log out
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="bg-brand-crimson hover:bg-brand-crimson-hover text-white px-4 py-2 sm:px-6 sm:py-2.5 font-bold rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
              >
                Sign Up
              </Link>
            </>
          )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 -mr-2 text-gray-600 hover:text-brand-crimson focus:outline-none transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col py-4 px-6 space-y-4 text-sm font-bold tracking-wider uppercase text-gray-600">
          <NavLink
            to="/explorer"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `block transition-colors hover:text-brand-crimson ${isActive ? "text-brand-crimson" : ""}`
            }
          >
            Explorer
          </NavLink>
          <NavLink
            to="/create"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `block transition-colors hover:text-brand-crimson ${isActive ? "text-brand-crimson" : ""}`
            }
          >
            Create
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block transition-colors hover:text-brand-crimson ${isActive ? "text-brand-crimson" : ""}`
              }
            >
              Dashboard
            </NavLink>
          )}
          {!isAuthenticated && (
            <Link
              to="/signin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-600 hover:text-brand-crimson transition-colors sm:hidden"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
