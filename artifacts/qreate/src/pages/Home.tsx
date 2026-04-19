import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
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
import { saveQrCode, updateQrCode, loadQrCode } from "@/lib/local-storage";
import {
  Download, Link as LinkIcon, Type, Mail, Phone, Wifi,
  Image as ImageIcon, Save, Sparkles, CheckCircle2,
  MessageSquare, User, MapPin, CalendarDays, Send, Pencil,
  Upload, X,
} from "lucide-react";
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

type QrCodeType =
  | "url" | "text" | "email" | "phone" | "wifi"
  | "sms" | "vcard" | "location" | "event" | "whatsapp" | "telegram";

type ContentData = {
  // URL
  url: string;
  // Текст
  text: string;
  // Email
  email: string;
  subject: string;
  body: string;
  // Телефон
  phone: string;
  // Wi-Fi
  ssid: string;
  password: string;
  encryption: string;
  // SMS
  smsPhone: string;
  smsMessage: string;
  // vCard
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  vcardPhone: string;
  vcardEmail: string;
  website: string;
  // Геолокация
  latitude: string;
  longitude: string;
  locationLabel: string;
  // Событие
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  eventLocation: string;
  eventDescription: string;
  // WhatsApp
  waPhone: string;
  waMessage: string;
  // Telegram
  tgUsername: string;
};

const typeButtons = [
  { id: "url",      icon: LinkIcon,      label: "Ссылка",     color: "from-blue-500 to-blue-600" },
  { id: "text",     icon: Type,          label: "Текст",      color: "from-gray-500 to-gray-600" },
  { id: "email",    icon: Mail,          label: "Email",      color: "from-orange-500 to-orange-600" },
  { id: "phone",    icon: Phone,         label: "Телефон",    color: "from-green-500 to-green-600" },
  { id: "wifi",     icon: Wifi,          label: "Wi-Fi",      color: "from-cyan-500 to-cyan-600" },
  { id: "sms",      icon: MessageSquare, label: "SMS",        color: "from-yellow-500 to-yellow-600" },
  { id: "vcard",    icon: User,          label: "Контакт",    color: "from-pink-500 to-pink-600" },
  { id: "location", icon: MapPin,        label: "Геолокация", color: "from-red-500 to-red-600" },
  { id: "event",    icon: CalendarDays,  label: "Событие",    color: "from-violet-500 to-violet-600" },
  { id: "whatsapp", icon: MessageSquare, label: "WhatsApp",   color: "from-emerald-500 to-emerald-600" },
  { id: "telegram", icon: Send,          label: "Telegram",   color: "from-sky-500 to-sky-600" },
] as const;

export default function Home() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const editId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("edit") ?? null;
  }, []);

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
    smsPhone: "",
    smsMessage: "",
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    vcardPhone: "",
    vcardEmail: "",
    website: "",
    latitude: "55.7558",
    longitude: "37.6176",
    locationLabel: "",
    eventTitle: "",
    eventStart: "",
    eventEnd: "",
    eventLocation: "",
    eventDescription: "",
    waPhone: "",
    waMessage: "",
    tgUsername: "",
  });

  const set = (fields: Partial<ContentData>) => setContentData((d) => ({ ...d, ...fields }));

  const [style, setStyle] = useState<ExtendedQrStyle>({
    fgColor: "#ffffff",
    bgColor: "#121217",
    errorCorrectionLevel: "H",
    logoUrl: "",
    logoSize: 0.2,
    gradient: { type: "linear", colorStart: "#8b5cf6", colorEnd: "#d946ef", rotation: 45 },
    frameStyle: "none",
    frameColor: "",
    caption: "",
    captionColor: "",
  });

  const [useGradient, setUseGradient] = useState(true);
  const [logoTab, setLogoTab] = useState<"upload" | "url">("upload");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const generatedRef = useRef(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editId) return;
    const saved = loadQrCode(editId);
    if (!saved) return;
    setName(saved.name);
    setType(saved.type as QrCodeType);
    if (saved.fields) {
      setContentData((d) => ({ ...d, ...(saved.fields as Partial<ContentData>) }));
    }
    const savedStyle = saved.style as ExtendedQrStyle;
    setStyle(savedStyle);
    setUseGradient(!!savedStyle.gradient);
  }, [editId]);

  if (useGradient && !style.gradient) {
    setStyle((s) => ({
      ...s,
      gradient: { type: "linear", colorStart: "#8b5cf6", colorEnd: "#d946ef", rotation: 45 },
    }));
  } else if (!useGradient && style.gradient) {
    setStyle((s) => ({ ...s, gradient: undefined }));
  }

  const formatDate = (iso: string) => iso.replace(/[-:]/g, "").replace("T", "").slice(0, 15);

  const generatedContent = useMemo(() => {
    const d = contentData;
    switch (type) {
      case "url":
        return d.url || "https://qreate.app";
      case "text":
        return d.text || " ";
      case "email":
        return `mailto:${d.email}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(d.body)}`;
      case "phone":
        return `tel:${d.phone}`;
      case "wifi":
        return `WIFI:T:${d.encryption};S:${d.ssid};P:${d.password};;`;
      case "sms":
        return `smsto:${d.smsPhone}:${d.smsMessage}`;
      case "vcard":
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${d.lastName};${d.firstName};;;`,
          `FN:${[d.firstName, d.lastName].filter(Boolean).join(" ") || "Контакт"}`,
          d.company && `ORG:${d.company}`,
          d.jobTitle && `TITLE:${d.jobTitle}`,
          d.vcardPhone && `TEL;TYPE=CELL:${d.vcardPhone}`,
          d.vcardEmail && `EMAIL:${d.vcardEmail}`,
          d.website && `URL:${d.website}`,
          "END:VCARD",
        ].filter(Boolean).join("\n");
      case "location":
        return `geo:${d.latitude},${d.longitude}${d.locationLabel ? `?q=${encodeURIComponent(d.locationLabel)}` : ""}`;
      case "event": {
        const start = d.eventStart ? formatDate(d.eventStart) : "20260101T120000";
        const end = d.eventEnd ? formatDate(d.eventEnd) : "20260101T130000";
        return [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:${d.eventTitle || "Событие"}`,
          d.eventLocation && `LOCATION:${d.eventLocation}`,
          d.eventDescription && `DESCRIPTION:${d.eventDescription}`,
          "END:VEVENT",
          "END:VCALENDAR",
        ].filter(Boolean).join("\n");
      }
      case "whatsapp":
        return `https://wa.me/${d.waPhone.replace(/\D/g, "")}${d.waMessage ? `?text=${encodeURIComponent(d.waMessage)}` : ""}`;
      case "telegram":
        return `https://t.me/${d.tgUsername.replace(/^@/, "")}`;
      default:
        return d.url || "https://qreate.app";
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

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Неверный формат", description: "Пожалуйста, выберите изображение.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "Максимальный размер — 5 МБ.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setStyle((s) => ({ ...s, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
    if (logoFileRef.current) logoFileRef.current.value = "";
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      const fields: Record<string, unknown> = { ...contentData };
      if (editId) {
        updateQrCode(editId, {
          name,
          type,
          content: generatedContent,
          style: style as Record<string, unknown>,
          fields,
        });
        toast({ title: "✏️ Обновлено!", description: "QR-код сохранён в истории." });
      } else {
        saveQrCode({
          name,
          type,
          content: generatedContent,
          style: style as Record<string, unknown>,
          fields,
          isDynamic: false,
        });
        toast({ title: "💾 Сохранено!", description: "QR-код добавлен в вашу коллекцию." });
      }
      setJustSaved(true);
      setTimeout(() => {
        navigate("/history");
      }, 800);
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = "bg-foreground/[0.05] border-border h-12 rounded-xl focus-visible:ring-primary";
  const textareaCls = "bg-foreground/[0.05] border-border rounded-xl resize-none focus-visible:ring-primary";

  return (
    <AppLayout>
      {editId ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-primary/10 border border-primary/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Режим редактирования</p>
              <p className="text-sm text-muted-foreground">Измените QR-код и нажмите «Обновить»</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/history")}
            className="text-sm rounded-xl hover:bg-foreground/10 shrink-0"
          >
            ← Назад к коллекции
          </Button>
        </motion.div>
      ) : (
        <div className="mb-12 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/[0.05] border border-border text-sm font-medium text-foreground/80 mb-4"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Премиум Генератор
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-6xl font-black"
          >
            Создайте незабываемые <br className="hidden md:block" />
            <span className="text-gradient">Связи</span>
          </motion.h1>
        </div>
      )}

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
                className="text-2xl font-display font-bold h-14 bg-transparent border-0 border-b-2 border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-foreground/20"
                placeholder="например, Меню ресторана"
              />
            </div>

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="w-full h-14 bg-foreground/[0.05] border border-border p-1 mb-8 rounded-2xl grid grid-cols-3">
                <TabsTrigger value="content" className="rounded-xl data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground transition-all">
                  Контент
                </TabsTrigger>
                <TabsTrigger value="colors" className="rounded-xl data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground transition-all">
                  Цвета
                </TabsTrigger>
                <TabsTrigger value="design" className="rounded-xl data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground transition-all">
                  Дизайн
                </TabsTrigger>
              </TabsList>

              {/* ── КОНТЕНТ ── */}
              <TabsContent value="content" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {typeButtons.map((t) => {
                    const isActive = type === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={`flex flex-col items-center justify-center gap-2 py-3.5 px-2 rounded-2xl border transition-all duration-200 ${
                          isActive
                            ? "bg-primary/20 border-primary text-foreground shadow-lg shadow-primary/20"
                            : "bg-foreground/[0.04] border-border text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? `bg-gradient-to-br ${t.color}` : "bg-foreground/[0.07]"}`}>
                          <t.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[11px] font-medium leading-none">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-foreground/[0.03] p-6 rounded-2xl border border-border space-y-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {type === "url" && (
                        <div className="space-y-2">
                          <Label>URL сайта</Label>
                          <Input placeholder="https://example.com" value={contentData.url} onChange={(e) => set({ url: e.target.value })} className={inputCls} />
                        </div>
                      )}

                      {type === "text" && (
                        <div className="space-y-2">
                          <Label>Текст</Label>
                          <Textarea placeholder="Введите ваш текст здесь..." value={contentData.text} onChange={(e) => set({ text: e.target.value })} className={`${textareaCls} min-h-[120px]`} />
                        </div>
                      )}

                      {type === "email" && (
                        <>
                          <div className="space-y-2">
                            <Label>Email адрес</Label>
                            <Input type="email" placeholder="hello@example.com" value={contentData.email} onChange={(e) => set({ email: e.target.value })} className={inputCls} />
                          </div>
                          <div className="space-y-2">
                            <Label>Тема письма</Label>
                            <Input placeholder="Запрос" value={contentData.subject} onChange={(e) => set({ subject: e.target.value })} className={inputCls} />
                          </div>
                          <div className="space-y-2">
                            <Label>Текст письма</Label>
                            <Textarea placeholder="Привет..." value={contentData.body} onChange={(e) => set({ body: e.target.value })} className={textareaCls} />
                          </div>
                        </>
                      )}

                      {type === "phone" && (
                        <div className="space-y-2">
                          <Label>Номер телефона</Label>
                          <Input type="tel" placeholder="+7 900 000 00 00" value={contentData.phone} onChange={(e) => set({ phone: e.target.value })} className={inputCls} />
                        </div>
                      )}

                      {type === "wifi" && (
                        <>
                          <div className="space-y-2">
                            <Label>Имя сети (SSID)</Label>
                            <Input placeholder="Гостевая сеть" value={contentData.ssid} onChange={(e) => set({ ssid: e.target.value })} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Пароль</Label>
                              <Input type="password" placeholder="••••••••" value={contentData.password} onChange={(e) => set({ password: e.target.value })} className={inputCls} />
                            </div>
                            <div className="space-y-2">
                              <Label>Шифрование</Label>
                              <Select value={contentData.encryption} onValueChange={(v) => set({ encryption: v })}>
                                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                                <SelectContent className="glass-card border-border">
                                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                                  <SelectItem value="WEP">WEP</SelectItem>
                                  <SelectItem value="nopass">Без пароля</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}

                      {type === "sms" && (
                        <>
                          <div className="space-y-2">
                            <Label>Номер телефона</Label>
                            <Input type="tel" placeholder="+7 900 000 00 00" value={contentData.smsPhone} onChange={(e) => set({ smsPhone: e.target.value })} className={inputCls} />
                          </div>
                          <div className="space-y-2">
                            <Label>Текст сообщения (необязательно)</Label>
                            <Textarea placeholder="Привет! Хочу узнать..." value={contentData.smsMessage} onChange={(e) => set({ smsMessage: e.target.value })} className={`${textareaCls} min-h-[100px]`} />
                          </div>
                        </>
                      )}

                      {type === "vcard" && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Имя</Label>
                              <Input placeholder="Иван" value={contentData.firstName} onChange={(e) => set({ firstName: e.target.value })} className={inputCls} />
                            </div>
                            <div className="space-y-2">
                              <Label>Фамилия</Label>
                              <Input placeholder="Иванов" value={contentData.lastName} onChange={(e) => set({ lastName: e.target.value })} className={inputCls} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Компания</Label>
                              <Input placeholder="ООО Компания" value={contentData.company} onChange={(e) => set({ company: e.target.value })} className={inputCls} />
                            </div>
                            <div className="space-y-2">
                              <Label>Должность</Label>
                              <Input placeholder="Директор" value={contentData.jobTitle} onChange={(e) => set({ jobTitle: e.target.value })} className={inputCls} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Телефон</Label>
                              <Input type="tel" placeholder="+7 900 000 00 00" value={contentData.vcardPhone} onChange={(e) => set({ vcardPhone: e.target.value })} className={inputCls} />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input type="email" placeholder="ivan@example.com" value={contentData.vcardEmail} onChange={(e) => set({ vcardEmail: e.target.value })} className={inputCls} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Сайт</Label>
                            <Input placeholder="https://example.com" value={contentData.website} onChange={(e) => set({ website: e.target.value })} className={inputCls} />
                          </div>
                        </>
                      )}

                      {type === "location" && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Широта</Label>
                              <Input placeholder="55.7558" value={contentData.latitude} onChange={(e) => set({ latitude: e.target.value })} className={inputCls} />
                            </div>
                            <div className="space-y-2">
                              <Label>Долгота</Label>
                              <Input placeholder="37.6176" value={contentData.longitude} onChange={(e) => set({ longitude: e.target.value })} className={inputCls} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Название места (необязательно)</Label>
                            <Input placeholder="Красная площадь, Москва" value={contentData.locationLabel} onChange={(e) => set({ locationLabel: e.target.value })} className={inputCls} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Совет: Найдите координаты в Google Maps — нажмите на место правой кнопкой.
                          </p>
                        </>
                      )}

                      {type === "event" && (
                        <>
                          <div className="space-y-2">
                            <Label>Название события</Label>
                            <Input placeholder="Конференция по маркетингу" value={contentData.eventTitle} onChange={(e) => set({ eventTitle: e.target.value })} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Начало</Label>
                              <Input type="datetime-local" value={contentData.eventStart} onChange={(e) => set({ eventStart: e.target.value })} className={inputCls} />
                            </div>
                            <div className="space-y-2">
                              <Label>Конец</Label>
                              <Input type="datetime-local" value={contentData.eventEnd} onChange={(e) => set({ eventEnd: e.target.value })} className={inputCls} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Место проведения</Label>
                            <Input placeholder="Москва, Центр международной торговли" value={contentData.eventLocation} onChange={(e) => set({ eventLocation: e.target.value })} className={inputCls} />
                          </div>
                          <div className="space-y-2">
                            <Label>Описание (необязательно)</Label>
                            <Textarea placeholder="Краткое описание события..." value={contentData.eventDescription} onChange={(e) => set({ eventDescription: e.target.value })} className={`${textareaCls} min-h-[80px]`} />
                          </div>
                        </>
                      )}

                      {type === "whatsapp" && (
                        <>
                          <div className="space-y-2">
                            <Label>Номер WhatsApp</Label>
                            <Input type="tel" placeholder="+7 900 000 00 00" value={contentData.waPhone} onChange={(e) => set({ waPhone: e.target.value })} className={inputCls} />
                            <p className="text-xs text-muted-foreground">Укажите номер с кодом страны, без пробелов и скобок.</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Заранее заполненное сообщение (необязательно)</Label>
                            <Textarea placeholder="Здравствуйте! Хотел узнать о ваших услугах..." value={contentData.waMessage} onChange={(e) => set({ waMessage: e.target.value })} className={`${textareaCls} min-h-[100px]`} />
                          </div>
                        </>
                      )}

                      {type === "telegram" && (
                        <div className="space-y-2">
                          <Label>Telegram-юзернейм</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                            <Input
                              placeholder="username"
                              value={contentData.tgUsername.replace(/^@/, "")}
                              onChange={(e) => set({ tgUsername: e.target.value.replace(/^@/, "") })}
                              className={`${inputCls} pl-9`}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Введите юзернейм канала, бота или человека. QR откроет чат в Telegram.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </TabsContent>

              {/* ── ЦВЕТА ── */}
              <TabsContent value="colors" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between p-4 bg-foreground/[0.03] rounded-2xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Включить градиент</Label>
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

                <div className="space-y-3 pt-4 border-t border-border">
                  <Label>Цвет фона</Label>
                  <ColorPickerPopover
                    color={style.bgColor || "#121217"}
                    onChange={(c) => setStyle((s) => ({ ...s, bgColor: c }))}
                  />
                </div>
              </TabsContent>

              {/* ── ДИЗАЙН ── */}
              <TabsContent value="design" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                              ? "bg-primary/20 border-primary text-foreground shadow-lg shadow-primary/20"
                              : "bg-foreground/[0.04] border-border text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground"
                          }`}
                        >
                          {f.icon}
                          <span className="text-[11px] font-medium leading-none">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {style.frameStyle && style.frameStyle !== "none" && (
                    <div className="space-y-3 pt-2">
                      <Label>Цвет рамки</Label>
                      <ColorPickerPopover
                        color={style.frameColor || style.gradient?.colorStart || style.fgColor || "#8b5cf6"}
                        onChange={(c) => setStyle((s) => ({ ...s, frameColor: c }))}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <Label>Логотип в центре QR</Label>

                  {/* Tab switcher */}
                  <div className="flex gap-1 p-1 bg-foreground/[0.05] rounded-xl border border-border w-fit">
                    <button
                      onClick={() => setLogoTab("upload")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        logoTab === "upload"
                          ? "bg-primary/20 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Загрузить файл
                    </button>
                    <button
                      onClick={() => setLogoTab("url")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        logoTab === "url"
                          ? "bg-primary/20 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> По ссылке
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFile}
                  />

                  <AnimatePresence mode="wait">
                    {logoTab === "upload" ? (
                      <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                      >
                        {style.logoUrl?.startsWith("data:") ? (
                          <div className="flex items-center gap-3 p-3 bg-foreground/[0.04] rounded-2xl border border-border">
                            <img
                              src={style.logoUrl}
                              alt="logo"
                              className="w-12 h-12 object-contain rounded-xl border border-border bg-foreground/[0.05]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">Логотип загружен</p>
                              <p className="text-xs text-muted-foreground">Нажмите «Изменить» чтобы выбрать другой</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg border-border h-8 text-xs"
                                onClick={() => logoFileRef.current?.click()}
                              >
                                Изменить
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive"
                                onClick={() => setStyle((s) => ({ ...s, logoUrl: "" }))}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => logoFileRef.current?.click()}
                            className="w-full flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-foreground/[0.06] flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                              <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium">Нажмите для выбора файла</p>
                              <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, SVG, WebP — до 5 МБ</p>
                            </div>
                          </button>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="url"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                          <Input
                            placeholder="https://example.com/logo.png"
                            value={style.logoUrl?.startsWith("data:") ? "" : (style.logoUrl || "")}
                            onChange={(e) => setStyle((s) => ({ ...s, logoUrl: e.target.value }))}
                            className="bg-foreground/[0.05] border-border h-12 pl-11 rounded-xl"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {style.logoUrl && (
                    <div className="space-y-4 p-4 bg-foreground/[0.04] rounded-2xl border border-border">
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

                {/* Caption text */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-muted-foreground" /> Подпись под QR-кодом
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">Текст появится ниже QR-кода и войдёт в экспорт</p>
                  </div>
                  <Input
                    placeholder="Например: Сканируй для меню"
                    value={style.caption || ""}
                    onChange={(e) => setStyle((s) => ({ ...s, caption: e.target.value }))}
                    className="bg-foreground/[0.05] border-border h-12 rounded-xl"
                    maxLength={60}
                  />
                  {style.caption && (
                    <div className="space-y-3 p-4 bg-foreground/[0.04] rounded-2xl border border-border">
                      <Label>Цвет подписи</Label>
                      <ColorPickerPopover
                        color={style.captionColor || style.gradient?.colorStart || style.fgColor || "#8b5cf6"}
                        onChange={(c) => setStyle((s) => ({ ...s, captionColor: c }))}
                        label={style.captionColor || style.gradient?.colorStart || style.fgColor || "#8b5cf6"}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <Label>Уровень коррекции ошибок</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Более высокий уровень позволяет читать QR-код д��же при частичном перекрытии (например, логотипом).
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {(["L", "M", "Q", "H"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setStyle((s) => ({ ...s, errorCorrectionLevel: level }))}
                        className={`py-3 rounded-xl border font-medium transition-all ${
                          style.errorCorrectionLevel === level
                            ? "bg-primary/20 border-primary text-foreground"
                            : "bg-foreground/[0.04] border-border text-muted-foreground hover:bg-foreground/[0.07]"
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
                    className={`w-full h-14 rounded-xl font-bold text-lg shadow-lg border-0 transition-all active:scale-[0.98] text-white ${
                      justSaved
                        ? "bg-green-600 hover:bg-green-700 shadow-green-600/25"
                        : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-primary/25"
                    }`}
                  >
                    {justSaved ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" /> {editId ? "Обновлено!" : "Сохранено!"}
                      </>
                    ) : isSaving ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {editId ? <Pencil className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        {editId ? "Обновить QR-код" : "Сохранить в коллекцию"}
                      </>
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleExport("png")}
                  variant="outline"
                  className="h-12 rounded-xl bg-foreground/[0.05] border-border hover:bg-foreground/10 hover:text-foreground"
                >
                  <Download className="w-4 h-4 mr-2" /> PNG
                </Button>
                <Button
                  onClick={() => handleExport("svg")}
                  variant="outline"
                  className="h-12 rounded-xl bg-foreground/[0.05] border-border hover:bg-foreground/10 hover:text-foreground"
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
