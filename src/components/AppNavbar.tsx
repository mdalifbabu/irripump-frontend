import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { Droplet, LogOut, Menu, X, User, ChevronDown, MapPin, Users } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
}

interface BreadcrumbExtra {
  label: string;
  to: string;
}

interface AppNavbarProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  rightContent?: React.ReactNode;
  /** Extra clickable crumbs inserted between the pump/year/season context and the current page
   *  — e.g. a farmer's name linking back to their detail page from a payments/lands/ledger tab. */
  breadcrumbExtra?: BreadcrumbExtra[];
}

const ALL_LAND_PATH: Record<string, string> = { ADMIN: "/admin/lands", USER: "/user/lands/master-list" };
const ALL_FARMER_PATH: Record<string, string> = { ADMIN: "/admin/farmers", USER: "/user/farmers/master-list" };
const HOME_PATH: Record<string, string> = { ADMIN: "/admin/dashboard", USER: "/user/dashboard" };
const NO_CONTEXT_PATHS = new Set([
  "/user/dashboard", "/admin/dashboard", "/user/farmers/master-list", "/user/lands/master-list",
]);

// Every real section root a pump/year/season change is allowed to land on. Anything not listed
// here falls back to the role's dashboard instead.
const KNOWN_SECTION_ROOTS: Record<string, string[]> = {
  USER: ["/user/dashboard", "/user/farmers", "/user/lands", "/user/seasons", "/user/payments", "/user/unit-prices"],
  ADMIN: ["/admin/dashboard", "/admin/pumps", "/admin/users", "/admin/farmers", "/admin/lands", "/admin/unit-prices", "/admin/seasons", "/admin/audit-log"],
};

function sectionRootFor(pathname: string, role: string): string {
  const known = KNOWN_SECTION_ROOTS[role] ?? KNOWN_SECTION_ROOTS.USER;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const candidate = `/${parts[0]}/${parts[1]}`;
    if (known.includes(candidate)) return candidate;
  }
  return HOME_PATH[role] ?? HOME_PATH.USER;
}

/**
 * A farmer/land opened under the old pump/year/season stops making sense the moment any of
 * those change — its id, payments, or assignments belonged to a different context. Rather than
 * leave a stale/mismatched detail page on screen, drop back to that section's root list (or the
 * dashboard, if the current path isn't a recognized section) once the user actually changes
 * context — never on the page's own initial mount.
 */
function useRedirectToSectionRootOnContextChange(role: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const { pumpId, year, selectedSeason } = usePumpContext();
  const seasonId = selectedSeason?.id ?? null;
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (NO_CONTEXT_PATHS.has(location.pathname)) return;
    const root = sectionRootFor(location.pathname, role);
    if (root !== location.pathname) navigate(root);
    // Only pump/year/season changes should trigger this — not route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pumpId, year, seasonId]);
}

function useBreadcrumbs(title: string, extra?: BreadcrumbExtra[]) {
  const location = useLocation();
  const { user } = useAuth();
  const { pumps, pumpId, year, selectedSeason } = usePumpContext();
  const role = user?.role ?? "USER";
  const homePath = HOME_PATH[role];

  if (location.pathname === homePath) return null;

  const crumbs: { label: string; to?: string }[] = [{ label: "হোম", to: homePath }];

  if (location.pathname.startsWith("/user/") && !NO_CONTEXT_PATHS.has(location.pathname)) {
    const pump = pumps.find((p) => p.id === pumpId);
    if (pump) crumbs.push({ label: pump.pumpNameBengali });
    if (year) crumbs.push({ label: String(year) });
    if (selectedSeason && location.pathname !== "/user/seasons") {
      crumbs.push({ label: selectedSeason.seasonNameBengali });
    }
  }

  extra?.forEach((e) => crumbs.push({ label: e.label, to: e.to }));
  crumbs.push({ label: title });
  return crumbs;
}

const AppNavbar = ({ title, subtitle, navItems, rightContent, breadcrumbExtra }: AppNavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const role = user?.role ?? "USER";
  const breadcrumbs = useBreadcrumbs(title, breadcrumbExtra);
  useRedirectToSectionRootOnContextChange(role);

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const displayName = user?.fullName || user?.username;

  return (
    <nav className="bg-card border-b border-border px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Row 1: logo + title + hamburger */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Droplet className="w-4 h-4 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold truncate">{title}</h1>
              {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 flex-wrap justify-end max-w-[70%]">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <User className="w-4 h-4" />
                  <span className="max-w-[10rem] truncate">{displayName || "প্রোফাইল"}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {displayName && <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(ALL_LAND_PATH[role])}>
                  <MapPin className="w-4 h-4 mr-2" /> সকল জমির তালিকা
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(ALL_FARMER_PATH[role])}>
                  <Users className="w-4 h-4 mr-2" /> সকল কৃষকের তালিকা
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Row 2: breadcrumbs */}
        {breadcrumbs && (
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5 md:gap-2.5">
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.to && i < breadcrumbs.length - 1 ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Row 3 (desktop): rightContent (PumpSelector, etc.) on its own line */}
        {rightContent && (
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {rightContent}
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-1 pt-3 border-t border-border space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"}
                className="w-full justify-start"
                size="sm"
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                {item.label}
              </Button>
            ))}
            {rightContent && <div className="py-1">{rightContent}</div>}
            {displayName && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">{displayName}</div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={() => { navigate(ALL_LAND_PATH[role]); setMobileMenuOpen(false); }}
            >
              <MapPin className="w-4 h-4 mr-2" /> সকল জমির তালিকা
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={() => { navigate(ALL_FARMER_PATH[role]); setMobileMenuOpen(false); }}
            >
              <Users className="w-4 h-4 mr-2" /> সকল কৃষকের তালিকা
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AppNavbar;
