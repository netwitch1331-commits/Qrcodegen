import { Link, useLocation } from "wouter";
import { QrCode, LayoutGrid, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-primary transition-colors">
            QReate
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button
              variant="ghost"
              className={`rounded-full px-6 transition-all ${location === "/" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Генератор
            </Button>
          </Link>
          <Link href="/history">
            <Button
              variant="ghost"
              className={`rounded-full px-6 transition-all ${location === "/history" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              История
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-white/20 cursor-pointer hover:border-white/50 transition-colors" />
        </div>
      </div>
    </header>
  );
}
