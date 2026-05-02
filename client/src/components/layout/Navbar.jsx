import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, PenLine, ChevronDown, LogOut, User, GitCompare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCompareStore } from '../../store/compareStore';
import { useDebounce } from '../../hooks/useDebounce';
import { googleLogin } from '../../api/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, loading, logout } = useAuthStore();
  const compareStore = useCompareStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Navigate on debounced search
  useEffect(() => {
    if (debouncedSearch) {
      navigate(`/?search=${encodeURIComponent(debouncedSearch)}`);
    }
  }, [debouncedSearch]);

  // Clear search when leaving home
  useEffect(() => {
    if (location.pathname !== '/') {
      setSearchTerm('');
    }
    // Close mobile menu on route change
    setMobileOpen(false);
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Oracle', path: '/oracle', icon: <Sparkles className="w-3.5 h-3.5 inline mb-0.5 mr-0.5" /> },
    { label: 'Write Review', path: '/write-review', icon: <PenLine className="w-3.5 h-3.5 inline mb-0.5 mr-0.5" /> },
  ];

  const compareCount = compareStore.colleges?.length ?? 0;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      {/* ── Desktop ── */}
      <div className="hidden md:flex items-center gap-4 px-6 h-16 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 font-bold text-xl tracking-tight text-gray-900 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🔥</span>
          <span>
            Rate<span className="text-primary">My</span>College
            <span className="text-xs font-semibold text-orange-500 ml-1 align-top">IN</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search colleges, professors…"
            className="w-full h-9 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
          />
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          {/* Compare badge */}
          {compareCount > 0 && (
            <Link
              to="/compare"
              className="relative px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5 inline mb-0.5 mr-0.5" />
              Compare
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {compareCount}
              </span>
            </Link>
          )}
        </div>

        {/* Auth area */}
        <div className="shrink-0 ml-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">
                  {user?.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={googleLogin}
              className="px-4 py-1.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="flex md:hidden items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center gap-1.5 font-bold text-lg text-gray-900">
          <span className="text-xl">🔥</span>
          <span>
            Rate<span className="text-primary">My</span>College
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1 shadow-lg">
          {/* Mobile search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search colleges…"
            className="w-full h-9 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm mb-2 focus:outline-none focus:border-primary transition"
          />

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {link.icon}{link.label}
            </Link>
          ))}

          {compareCount > 0 && (
            <Link to="/compare" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1">
              <GitCompare className="w-4 h-4" /> Compare ({compareCount})
            </Link>
          )}

          <div className="mt-2 pt-2 border-t border-gray-100">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="w-4 h-4" /> {user?.name}
                </Link>
                <button onClick={logout} className="text-sm text-red-500 flex items-center gap-1">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={googleLogin}
                className="w-full py-2 rounded-full bg-primary text-white text-sm font-semibold"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
