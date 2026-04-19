import { Mail, Github, Twitter, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-24 mb-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Основной контент футера */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 pb-12 border-b border-border/40">
          {/* О сервисе */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Qreate</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Премиум генератор QR-кодов для создания связей между миром физическим и цифровым.
            </p>
          </div>

          {/* Ссылки */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Навигация</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Создать QR-код
                </a>
              </li>
              <li>
                <a href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  История
                </a>
              </li>
            </ul>
          </div>

          {/* Поддержка */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Поддержка</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@qreate.app" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </li>
            </ul>
          </div>

          {/* Полезные боты */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Больше ботов</h4>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl border-border/40"
            >
              <a
                href="https://t.me/usefulbots2026_bot"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Полезные боты</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Копирайт */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground/60">
            © {currentYear} Qreate. Все права защищены.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/qreate"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/qreate"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
