import { Bell, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const DashboardHeader = ({ theme, onToggleTheme }: DashboardHeaderProps) => {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Supply Chain Command Center</h2>
          <p className="text-sm text-muted-foreground">Real-time monitoring and analytics</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent">
            3
          </Badge>
        </Button>

        <Button variant="ghost" size="icon" onClick={onToggleTheme}>
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
