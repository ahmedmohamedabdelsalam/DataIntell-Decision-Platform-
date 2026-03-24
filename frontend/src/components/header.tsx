import { Search, UserCircle, Moon, Sun } from 'lucide-react';
import { HealthStatus } from './health-status';
import { useEffect, useState } from 'react';

export function Header() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center w-96 bg-background/50 px-3 py-1.5 rounded-md border border-border focus-within:ring-1 focus-within:ring-primary transition-shadow">
        <Search size={18} className="text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search tasks or logs..." 
          className="bg-transparent border-none outline-none ml-2 text-sm text-foreground w-full placeholder:text-muted-foreground/50" 
        />
      </div>
      
      <div className="flex items-center space-x-5">
        <HealthStatus />
        <div className="h-4 w-px bg-border"></div>
        <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <UserCircle size={26} />
        </button>
      </div>
    </header>
  );
}
