import { useState, useMemo, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QrPreview, type ExtendedQrStyle, type FrameStyle } from "@/components/qr/QrPreview";
import { ColorPickerPopover } from "@/components/qr/ColorPickerPopover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportQrCode } from "@/lib/export-qr";
import { saveQrCode } from "@/lib/local-storage";
import { Download, Link as LinkIcon, Type, Mail, Phone, Wifi, Image as ImageIcon, Save, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FRAMES: { id: FrameStyle; label: string; icon: React.ReactNode }[] = [
  {
    id: "none",
    label: "Нет",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 opacity-40">
        <rect x="10" y="10" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    ),
  },
  {
    id: "simple",
    label: "Простая",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="3" />
        <rect x="14" y="14" width="20" height="20" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "rounded",
    label: "Скруглённая",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect x="6" y="6" width="36" height="36" rx="12" stroke="currentColor" strokeWidth="3" />
        <rect x="14" y="14" width="20" height="20" rx="4" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "double",
    label: "Двойная",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect x="5" y="5" width="38" height="38" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="10" y="10" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="16" y="16" width="16" height="16" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "corners",
    label: "Уголки",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <path d="M8 18V8H18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 8H40V18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 30V40H30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 40H8V30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="16" y="16" width="16" height="16" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "dots",
    label: "Пунктир",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 4" />
        <rect x="15" y="15" width="18" height="18" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "neon",
    label: "Неон",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect x="7" y="7" width="34" height="34" rx="8" stroke="currentColor" strokeWidth="2.5" opacity="0.4" />
        <rect x="7" y="7" width="34" height="34" rx="8" stroke="currentColor" strokeWidth="2" />
        <rect x="15" y="15" width="18" height="18" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "scan",
    label: "Скан",
    icon: (
      <svg viewBox="0 0 48 56" fill="none" className="w-8 h-9">
        <rect x="6" y="4" width="36" height="44" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <rect x="12" y="10" width="24" height="24" rx="1" fill="currentColor" opacity="0.15" />
        <rect x="6" y="37" width="36" height="11" rx="0" fill="currentColor" opacity="0.5" />
        <rect x="6" y="37" width="36" height="11" rx="6" fill="currentColor" opacity="0.5" style={{ clipPath: "inset(0 0 50% 0)" }} />
      </svg>
    ),
  },
];

type QrCodeType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard" | "event" | "payment";

type ContentData = {
  url: string;
  text: string;
  email: string;
  subject: string;
  body: string;
  phone: string;
  ssid: string;
  password: string;
  encryption: string;
};

export default function Home() {
  const { toast } = useToast();
  const [name, setName] = useState("Мой QR-код");
  const [type, setType] = useState<QrCodeType>("url");
  const [contentData, setContentData] = useState<ContentData>({
    url: "https://qreate.app",
    text: "",
    email: "",
    subject: "",
    body: "",
    phone: "",
    ssid: "",
    password: "",
    encryption: "WPA",
  });

  const [style, setStyle] = useState<ExtendedQrStyle>({
    fgColor: "#ffffff",
    bgColor: "#121217",
    errorCorrectionLevel: "H",
    logoUrl: "",
    logoSize: 0.2,
    gradient: { type: "linear", colorStart: "#8b5cf6", colorEnd: "#d946ef", rotation: 45 },
    frameStyle: "none",
    frameColor: "",
  });

  const [useGradient, setUseGradient] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const generatedRef = useRef(false);

  if (useGradient && !style.gradient) {
    setStyle((s) => ({
      ...s,
      gradient: { type: "linear", colorStart: "#8b5cf6", colorEnd: "#d946ef", rotation: 45 },
    }));
  } else if (!useGradient && style.gradient) {
    setStyle((s) => ({ ...s, gradient: undefined }));
  }

  const generatedContent = useMemo(() => {
    switch (type) {
      case "url":
        return contentData.url;
      case "text":
        return contentData.text;
      case "email":
        return `mailto:${contentData.email}?subject=${encodeURIComponent(contentData.subject)}&body=${encodeURIComponent(contentData.body)}`;
      case "phone":
        return `tel:${contentData.phone}`;
      case "wifi":
        return `WIFI:T:${contentData.encryption};S:${contentData.ssid};P:${contentData.password};;`;
      default:
        return contentData.url;
    }
  }, [type, contentData]);

  const handleGenerated = useCallback(() => {
    if (!generatedRef.current) {
      generatedRef.current = true;
      return;
    }
    toast({
      title: "✅ QR-код сгенерирован",
      description: "Готов к использованию и скачиванию.",
      duration: 2500,
    });
  }, [toast]);

  const handleExport = async (format: "png" | "svg") => {
    try {
      toast({ title: "Подготовка...", description: "Генерируем файл высокого разрешения." });
      await exportQrCode(generatedContent, style, format, 1024);
      toast({ title: "Готово!", description: `Файл ${format.toUpperCase()} скачан.` });
    } catch {
      toast({ title: "Ошибка экспорта", description: "Попробуйте ещё раз.", variant: "destructive" });
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveQrCode({
        name,
        type,
        content: generatedContent,
        style: style as Record<string, unknown>,
        isDynamic: false,
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
      toast({ title: "💾 Сохранено!", description: "QR-код добавлен в историю браузера." });
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const typeButtons = [
    { id: "url", icon: LinkIcon, label: "Ссылка" },
    { id: "text", icon: Type, label: "Текст" },
    { id: "email", icon: Mail, label: "Email" },
    { id: "phone", icon: Phone, label: "Телефон" },
    { id: "wifi", icon: Wifi, label: "Wi-Fi" },
  ] as const;

  return (
    <AppLayout>
      <div className="mb-12 text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/80 mb-4"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Премиум Генератор
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl md:text-6xl font-black text-white"
        >
          Создайте незабываемые <br className="hidden md:block" />
          <span className="text-gradient">Связи</span>
        </motion.h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        {/* Левая колонка: настройки */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <div className="mb-8">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">
                Название QR-кода
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-display font-bold h-14 bg-transparent border-0 border-b-2 border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-white/20"
                placeholder="например, Меню ресторана"
              />
            </div>

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="w-full h-14 bg-black/40 border border-white/5 p-1 mb-8 rounded-2xl grid grid-cols-3">
                <TabsTrigger value="content" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
                  Контент
                </TabsTrigger>
                <TabsTrigger value="colors" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
                  Цвета
                </TabsTrigger>
                <TabsTrigger value="design" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
                  Дизайн
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {typeButtons.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id as QrCodeType)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                        type === t.id
                          ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/20"
                          : "bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <t.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mt-6 space-y-4">
                  {type === "url" && (
                    <div className="space-y-2">
                      <Label>URL сайта</Label>
                      <Input
                        placeholder="https://example.com"
                        value={contentData.url}
                        onChange={(e) => setContentData({ ...contentData, url: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl"
                      />
                    </div>
                  )}

                  {type === "text" && (
                    <div className="space-y-2">
                      <Label>Текст</Label>
                      <Textarea
                        placeholder="Введите ваш текст здесь..."
                        value={contentData.text}
                        onChange={(e) => setContentData({ ...contentData, text: e.target.value })}
                        className="bg-black/40 border-white/10 min-h-[120px] rounded-xl resize-none"
                      />
                    </div>
                  )}

                  {type === "email" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email адрес</Label>
                        <Input
                          type="email"
                          placeholder="hello@example.com"
                          value={contentData.email}
                          onChange={(e) => setContentData({ ...contentData, email: e.target.value })}
                          className="bg-black/40 border-white/10 h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Тема</Label>
                        <Input
                          placeholder="Запрос"
                          value={contentData.subject}
                          onChange={(e) => setContentData({ ...contentData, subject: e.target.value })}
                          className="bg-black/40 border-white/10 h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Текст письма</Label>
                        <Textarea
                          placeholder="Привет..."
                          value={contentData.body}
                          onChange={(e) => setContentData({ ...contentData, body: e.target.value })}
                          className="bg-black/40 border-white/10 rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {type === "phone" && (
                    <div className="space-y-2">
                      <Label>Номер телефона</Label>
                      <Input
                        type="tel"
                        placeholder="+7 900 000 00 00"
                        value={contentData.phone}
                        onChange={(e) => setContentData({ ...contentData, phone: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl"
                      />
                    </div>
                  )}

                  {type === "wifi" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Имя сети (SSID)</Label>
                        <Input
                          placeholder="Гостевая сеть"
                          value={contentData.ssid}
                          onChange={(e) => setContentData({ ...contentData, ssid: e.target.value })}
                          className="bg-black/40 border-white/10 h-12 rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Пароль</Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={contentData.password}
                            onChange={(e) => setContentData({ ...contentData, password: e.target.value })}
                            className="bg-black/40 border-white/10 h-12 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Шифрование</Label>
                          <Select value={contentData.encryption} onValueChange={(v) => setContentData({ ...contentData, encryption: v })}>
                            <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10">
                              <SelectItem value="WPA">WPA/WPA2</SelectItem>
                              <SelectItem value="WEP">WEP</SelectItem>
                              <SelectItem value="nopass">Без пароля</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="space-y-0.5">
                    <Label className="text-base text-white">Включить градиент</Label>
                    <p className="text-sm text-muted-foreground">Применить красивый градиент к QR-коду.</p>
                  </div>
                  <Switch checked={useGradient} onCheckedChange={setUseGradient} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {useGradient ? (
                    <>
                      <div className="space-y-3">
                        <Label>Начало градиента</Label>
                        <ColorPickerPopover
                          color={style.gradient?.colorStart || "#8b5cf6"}
                          onChange={(c) => setStyle((s) => ({ ...s, gradient: { ...s.gradient!, colorStart: c } }))}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Конец градиента</Label>
                        <ColorPickerPopover
                          color={style.gradient?.colorEnd || "#d946ef"}
                          onChange={(c) => setStyle((s) => ({ ...s, gradient: { ...s.gradient!, colorEnd: c } }))}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 sm:col-span-2">
                      <Label>Цвет QR-кода</Label>
                      <ColorPickerPopover
                        color={style.fgColor || "#ffffff"}
                        onChange={(c) => setStyle((s) => ({ ...s, fgColor: c }))}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <Label>Цвет фона</Label>
                  <ColorPickerPopover
                    color={style.bgColor || "#121217"}
                    onChange={(c) => setStyle((s) => ({ ...s, bgColor: c }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Frame Picker */}
                <div className="space-y-4">
                  <Label>Стиль рамки</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {FRAMES.map((f) => {
                      const isActive = (style.frameStyle || "none") === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setStyle((s) => ({ ...s, frameStyle: f.id }))}
                          className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border transition-all duration-200 ${
                            isActive
                              ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/20"
                              : "bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {f.icon}
                          <span className="text-[11px] font-medium leading-none">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {(style.frameStyle && style.frameStyle !== "none") && (
                    <div className="space-y-3 pt-2">
                      <Label>Цвет рамки</Label>
                      <ColorPickerPopover
                        color={style.frameColor || style.gradient?.colorStart || style.fgColor || "#8b5cf6"}
                        onChange={(c) => setStyle((s) => ({ ...s, frameColor: c }))}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <Label>URL логотипа (необязательно)</Label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="https://example.com/logo.png"
                        value={style.logoUrl || ""}
                        onChange={(e) => setStyle((s) => ({ ...s, logoUrl: e.target.value }))}
                        className="bg-black/40 border-white/10 h-12 pl-11 rounded-xl"
                      />
                    </div>
                  </div>
                  {style.logoUrl && (
                    <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5 mt-4">
                      <div className="flex justify-between">
                        <Label>Размер логотипа</Label>
                        <span className="text-xs text-muted-foreground">{Math.round((style.logoSize || 0.2) * 100)}%</span>
                      </div>
                      <Slider
                        min={0.1}
                        max={0.4}
                        step={0.05}
                        value={[style.logoSize || 0.2]}
                        onValueChange={([v]) => setStyle((s) => ({ ...s, logoSize: v }))}
                        className="py-2"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <Label>Уровень коррекции ошибок</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Более высокий уровень позволяет читать QR-код даже при частичном перекрытии (например, логотипом).
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {(["L", "M", "Q", "H"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setStyle((s) => ({ ...s, errorCorrectionLevel: level }))}
                        className={`py-3 rounded-xl border font-medium transition-all ${
                          style.errorCorrectionLevel === level
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-black/20 border-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Правая колонка: предпросмотр и действия */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-28 space-y-6">
            <QrPreview content={generatedContent} styleConfig={style} onGenerated={handleGenerated} />

            <div className="glass-card rounded-[2rem] p-6 space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={justSaved ? "saved" : "save"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full h-14 rounded-xl font-bold text-lg shadow-lg border-0 text-white transition-all active:scale-[0.98] ${
                      justSaved
                        ? "bg-green-600 hover:bg-green-700 shadow-green-600/25"
                        : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-primary/25"
                    }`}
                  >
                    {justSaved ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Сохранено!
                      </>
                    ) : isSaving ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" /> Сохранить в историю
                      </>
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleExport("png")}
                  variant="outline"
                  className="h-12 rounded-xl bg-black/40 border-white/10 hover:bg-white/10 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" /> PNG
                </Button>
                <Button
                  onClick={() => handleExport("svg")}
                  variant="outline"
                  className="h-12 rounded-xl bg-black/40 border-white/10 hover:bg-white/10 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" /> SVG
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
