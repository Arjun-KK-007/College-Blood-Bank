import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Heart, Menu, X, Shield } from "lucide-react";
import { isAdmin, logoutAdmin } from "@/lib/store";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/donors", label: "Donor List" },
  { to: "/register", label: "Register" },
  { to: "/request", label: "Request Blood" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const admin = isAdmin();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-7 w-7 text-primary fill-primary" />
          <span className="font-display text-xl font-bold text-foreground">
            College <span className="text-primary">Blood Bank</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === l.to
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {admin ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                logoutAdmin();
                window.location.reload();
              }}
              className="ml-2"
            >
              Logout
            </Button>
          ) : (
            <Link to="/admin">
              <Button size="sm" variant="ghost" className="ml-2 text-muted-foreground">
                <Shield className="mr-1 h-4 w-4" /> Admin
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-card px-4 pb-4 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                location.pathname === l.to
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {admin ? (
            <button
              onClick={() => {
                logoutAdmin();
                window.location.reload();
              }}
              className="mt-1 block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground"
            >
              <Shield className="mr-1 inline h-4 w-4" /> Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
