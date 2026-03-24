import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TerminalSquare, BarChart, Database } from 'lucide-react';
import { cn } from '../utils/cn';

const navItems = [
  { text: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { text: 'Analysis Console', icon: TerminalSquare, path: '/agent' },
  { text: 'Analytics', icon: BarChart, path: '/analytics' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full z-10">
      <div className="p-6 flex items-center space-x-3 text-primary">
        <Database size={28} />
        <span className="text-xl font-bold text-foreground tracking-tight">DataIntell</span>
      </div>
      
      <div className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={20} />
              <span>{item.text}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-border/50 text-xs text-muted-foreground/60 text-center">
        Data System v1.0
      </div>
    </div>
  );
}
