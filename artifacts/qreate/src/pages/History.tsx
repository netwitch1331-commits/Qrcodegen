import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QrPreview } from "@/components/qr/QrPreview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Trash2, Calendar, Link as LinkIcon, Download, ArrowUpDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { exportQrCode } from "@/lib/export-qr";
import { loadQrCodes, deleteQrCode, type LocalQrCode } from "@/lib/local-storage";
import type { QrCodeStyle } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

type SortKey = "createdAt" | "name";

export default function History() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [codes, setCodes] = useState<LocalQrCode[]>([]);
  const { toast } = useToast();

  const reload = useCallback(() => {
    setCodes(loadQrCodes());
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [reload]);

  const filtered = codes
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ru");
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleDelete = (id: string) => {
    if (confirm("Удалить этот QR-код?")) {
      deleteQrCode(id);
      reload();
      toast({ title: "Удалено", description: "QR-код удалён из истории." });
    }
  };

  const handleDownload = (qr: LocalQrCode) => {
    toast({ title: "Экспорт...", description: "Подготавливаем изображение." });
    exportQrCode(qr.content, qr.style as QrCodeStyle, "png").catch(() => {
      toast({ title: "Ошибка экспорта", variant: "destructive" });
    });
  };

  const sortLabel: Record<SortKey, string> = {
    createdAt: "По дате",
    name: "По названию",
  };

  return (
    <AppLayout>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black mb-2 font-display">Мои QR-коды</h1>
          <p className="text-muted-foreground text-lg">
            {filtered.length > 0
              ? `Сохранено в браузере: ${codes.length} шт.`
              : "Здесь появятся ваши сохранённые QR-коды."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-foreground/[0.05] border-border rounded-xl w-full focus-visible:ring-primary"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-4 bg-foreground/[0.05] border-border rounded-xl hover:bg-foreground/10 hover:text-foreground whitespace-nowrap">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {sortLabel[sort]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-border">
              <DropdownMenuItem onClick={() => setSort("createdAt")}>По дате</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("name")}>По названию (А-Я)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center glass-card rounded-[2rem] border-dashed border-2 border-border"
            >
              <LinkIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">
                {search ? "Ничего не найдено" : "Пока нет QR-кодов"}
              </h3>
              <p className="text-muted-foreground">
                {search
                  ? "Попробуйте другой запрос."
                  : "Создайте первый QR-код в генераторе и сохраните его."}
              </p>
            </motion.div>
          ) : (
            filtered.map((qr) => (
              <motion.div
                key={qr.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card rounded-[2rem] p-4 group hover:bg-foreground/[0.03] transition-all duration-300 border border-border"
              >
                <div className="relative mb-6">
                  <div className="pointer-events-none">
                    <QrPreview content={qr.content} styleConfig={qr.style as QrCodeStyle} />
                  </div>

                  <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[2rem] flex flex-col items-center justify-center gap-3">
                    <Button onClick={() => handleDownload(qr)} className="rounded-full bg-background text-foreground hover:bg-background/80">
                      <Download className="w-4 h-4 mr-2" /> Скачать
                    </Button>
                  </div>
                </div>

                <div className="px-2 pb-2">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold truncate flex-1">{qr.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-foreground/10 -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card border-border">
                        <DropdownMenuItem onClick={() => handleDownload(qr)}>
                          <Download className="w-4 h-4 mr-2" /> Скачать PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/20 focus:text-destructive"
                          onClick={() => handleDelete(qr.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5 bg-foreground/[0.06] px-2.5 py-1 rounded-md capitalize">
                      {qr.type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(parseISO(qr.createdAt), "d MMM yyyy", { locale: ru })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

    </AppLayout>
  );
}
