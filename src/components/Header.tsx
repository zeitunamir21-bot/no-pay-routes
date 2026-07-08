import { Link } from "@tanstack/react-router";
import { MapPin, Plus, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DownloadApkButton } from "@/components/DownloadApkButton";


export function Header() {
  const { session, user } = useAuth();

  const { data: postTripTo } = useQuery({
    queryKey: ["post-trip-target", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<"/admin" | "/driver" | "/driver/signup" | null> => {
      const [{ data: roles }, { data: driver }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        supabase.from("drivers").select("status").eq("user_id", user!.id).maybeSingle(),
      ]);
      if (roles?.some((r) => r.role === "admin")) return "/admin";
      if (driver?.status === "approved") return "/driver";
      return "/driver/signup";
    },
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            North<span className="text-primary">Go</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <NavLink to="/" exact>Home</NavLink>
          <NavLink to="/trips">Trips</NavLink>
          <NavLink to="/my-bookings">My Bookings</NavLink>
          <NavLink to="/driver">Driver</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <DownloadApkButton variant="compact" className="hidden sm:inline-flex" />
          {session && postTripTo && (
            <Link
              to={postTripTo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Post a trip</span>
              <span className="sm:hidden">Trip</span>
            </Link>
          )}
          <Link
            to={session ? "/my-bookings" : "/auth"}
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold md:inline-flex"
          >
            <UserIcon className="h-3.5 w-3.5" />
            {session ? "Account" : "Sign in"}
          </Link>
        </div>
      </div>
    </header>

  );
}

function NavLink({
  to,
  exact,
  children,
}: {
  to: "/" | "/trips" | "/my-bookings" | "/driver" | "/admin";
  exact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      activeProps={{ className: "text-foreground bg-accent" }}
      className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground"
    >
      {children}
    </Link>
  );
}
