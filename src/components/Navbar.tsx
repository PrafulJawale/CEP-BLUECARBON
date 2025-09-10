import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppNavigation } from "@/components/ui/navigation-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Grid, LogOut, LogIn, User } from "lucide-react";

const getInitials = (name?: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
    setOpen(false);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white/70 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand - mobile first, single-line (no stacked text) */}
        <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="BlueCarbon home">
          <div className="w-10 h-10 rounded-lg bg-gradient-ocean flex items-center justify-center text-white font-semibold">
            BC
          </div>
          <span className="text-sm font-semibold text-gray-900 truncate">BlueCarbon</span>
        </Link>

        {/* Compact center (hidden on smallest screens) */}
        <div className="hidden sm:flex sm:items-center sm:gap-3 md:gap-6">
          {/* small icon quick links for tablet+ */}
          <AppNavigation />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* profile badge (minimal, single line) */}
          {isAuthenticated && user ? (
            <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/5">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm">
                {getInitials(user.username)}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-gray-900 truncate">{user.username}</span>
              </div>
            </div>
          ) : null}

          {/* desktop action buttons */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-900">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="glass" size="sm" className="text-gray-900">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="ocean" size="sm" className="text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* mobile menu toggle */}
          <button
            aria-expanded={open}
            aria-label="Open navigation"
            onClick={() => setOpen((s) => !s)}
            className="ml-1 inline-flex items-center justify-center rounded-md p-2 hover:bg-accent/10 md:hidden text-gray-900"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-over (right side) */}
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* overlay */}
        <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        {/* panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-80 sm:w-96 transform bg-white border-l shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-ocean flex items-center justify-center text-white font-semibold">
                BC
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">BlueCarbon</div>
              </div>
            </div>
            <button aria-label="Close" onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-accent/10 text-gray-900">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-auto h-[calc(100%-72px)]">
            {/* mobile-first: show icon-focused items (labels visible on sm+) */}
            {/* showAllRoutes ensures the mobile slide-over lists ALL routes (ignore role filtering) */}
            <AppNavigation />

            <div className="pt-2 border-t">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm">
                      {getInitials(user.username)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-xs text-gray-900/80">{user.role}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" className="flex gap-2 items-center justify-center text-gray-900" onClick={() => { navigate("/dashboard"); setOpen(false); }}>
                      <Grid className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                    <Button variant="ocean" className="flex gap-2 items-center justify-center" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 text-white" /> <span className="hidden sm:inline text-white">Logout</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="glass" className="w-full text-gray-900">
                      <LogIn className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Login</span>
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}>
                    <Button variant="ocean" className="w-full text-white">
                      <User className="mr-2 h-4 w-4 text-white" /> <span className="hidden sm:inline text-white">Register</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </nav>
  );
};

export default Navbar;