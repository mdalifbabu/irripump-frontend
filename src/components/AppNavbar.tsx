import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Droplet, LogOut, Menu, X } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
}

interface AppNavbarProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  rightContent?: React.ReactNode;
}

const AppNavbar = ({ title, subtitle, navItems, rightContent }: AppNavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <nav className="bg-card border-b border-border px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Droplet className="w-4 h-4 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold truncate">{title}</h1>
              {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
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
            {rightContent}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-border space-y-1">
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