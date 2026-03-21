import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QrPreview } from "@/components/qr/QrPreview";
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
import { QrCodeType, QrCodeStyle, useCreateQrCode } from "@workspace/api-client-react";
import { exportQrCode } from "@/lib/export-qr";
import { Download, Link as LinkIcon, Type, Mail, Phone, Wifi, Image as ImageIcon, Save, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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
  const createMutation = useCreateQrCode();
  
  const [name, setName] = useState("My QR Code");
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
    encryption: "WPA"
  });

  const [style, setStyle] = useState<QrCodeStyle>({
    fgColor: "#ffffff",
    bgColor: "#121217",
    errorCorrectionLevel: "H",
    logoUrl: "",
    logoSize: 0.2,
    gradient: undefined
  });

  const [useGradient, setUseGradient] = useState(true);

  // Initialize gradient if toggled on
  if (useGradient && !style.gradient) {
    setStyle(s => ({
      ...s,
      gradient: { type: "linear", colorStart: "#8b5cf6", colorEnd: "#d946ef", rotation: 45 }
    }));
  } else if (!useGradient && style.gradient) {
    setStyle(s => ({ ...s, gradient: undefined }));
  }

  const generatedContent = useMemo(() => {
    switch (type) {
      case "url": return contentData.url;
      case "text": return contentData.text;
      case "email": return `mailto:${contentData.email}?subject=${encodeURIComponent(contentData.subject)}&body=${encodeURIComponent(contentData.body)}`;
      case "phone": return `tel:${contentData.phone}`;
      case "wifi": return `WIFI:T:${contentData.encryption};S:${contentData.ssid};P:${contentData.password};;`;
      default: return contentData.url;
    }
  }, [type, contentData]);

  const handleExport = async (format: 'png' | 'svg') => {
    try {
      toast({ title: "Preparing export...", description: "Composing your high-res QR code." });
      await exportQrCode(generatedContent, style, format, 1024);
      toast({ title: "Success!", description: `Downloaded as ${format.toUpperCase()}` });
    } catch (e) {
      toast({ title: "Export Failed", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleSave = () => {
    createMutation.mutate({
      data: {
        name,
        type,
        content: generatedContent,
        style,
        isDynamic: false
      }
    }, {
      onSuccess: () => {
        toast({ title: "Saved!", description: "QR Code saved to your history." });
      },
      onError: (err) => {
        toast({ title: "Failed to save", description: err.message || "Please try again.", variant: "destructive" });
      }
    });
  };

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
          Premium Generator
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl md:text-6xl font-black text-white"
        >
          Create Unforgettable <br className="hidden md:block"/>
          <span className="text-gradient">Connections</span>
        </motion.h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <div className="mb-8">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Name your QR Code</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="text-2xl font-display font-bold h-14 bg-transparent border-0 border-b-2 border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-white/20"
                placeholder="e.g., Marketing Campaign Q3"
              />
            </div>

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="w-full h-14 bg-black/40 border border-white/5 p-1 mb-8 rounded-2xl grid grid-cols-3">
                <TabsTrigger value="content" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Content</TabsTrigger>
                <TabsTrigger value="colors" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Colors</TabsTrigger>
                <TabsTrigger value="design" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Design</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'url', icon: LinkIcon, label: 'Link' },
                    { id: 'text', icon: Type, label: 'Text' },
                    { id: 'email', icon: Mail, label: 'Email' },
                    { id: 'phone', icon: Phone, label: 'Phone' },
                    { id: 'wifi', icon: Wifi, label: 'Wi-Fi' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id as QrCodeType)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                        type === t.id 
                          ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <t.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mt-6 space-y-4">
                  {type === 'url' && (
                    <div className="space-y-2">
                      <Label>Website URL</Label>
                      <Input 
                        placeholder="https://example.com" 
                        value={contentData.url} 
                        onChange={e => setContentData({...contentData, url: e.target.value})}
                        className="bg-black/40 border-white/10 h-12 rounded-xl"
                      />
                    </div>
                  )}

                  {type === 'text' && (
                    <div className="space-y-2">
                      <Label>Plain Text</Label>
                      <Textarea 
                        placeholder="Enter your message here..." 
                        value={contentData.text} 
                        onChange={e => setContentData({...contentData, text: e.target.value})}
                        className="bg-black/40 border-white/10 min-h-[120px] rounded-xl resize-none"
                      />
                    </div>
                  )}

                  {type === 'email' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input type="email" placeholder="hello@example.com" value={contentData.email} onChange={e => setContentData({...contentData, email: e.target.value})} className="bg-black/40 border-white/10 h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input placeholder="Inquiry" value={contentData.subject} onChange={e => setContentData({...contentData, subject: e.target.value})} className="bg-black/40 border-white/10 h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Message Body</Label>
                        <Textarea placeholder="Hi there..." value={contentData.body} onChange={e => setContentData({...contentData, body: e.target.value})} className="bg-black/40 border-white/10 rounded-xl" />
                      </div>
                    </div>
                  )}
                  
                  {type === 'phone' && (
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input type="tel" placeholder="+1 234 567 8900" value={contentData.phone} onChange={e => setContentData({...contentData, phone: e.target.value})} className="bg-black/40 border-white/10 h-12 rounded-xl" />
                    </div>
                  )}

                  {type === 'wifi' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Network Name (SSID)</Label>
                        <Input placeholder="Guest Network" value={contentData.ssid} onChange={e => setContentData({...contentData, ssid: e.target.value})} className="bg-black/40 border-white/10 h-12 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input type="password" placeholder="secret123" value={contentData.password} onChange={e => setContentData({...contentData, password: e.target.value})} className="bg-black/40 border-white/10 h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Encryption</Label>
                          <Select value={contentData.encryption} onValueChange={v => setContentData({...contentData, encryption: v})}>
                            <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10">
                              <SelectItem value="WPA">WPA/WPA2</SelectItem>
                              <SelectItem value="WEP">WEP</SelectItem>
                              <SelectItem value="nopass">None</SelectItem>
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
                    <Label className="text-base text-white">Enable Gradient</Label>
                    <p className="text-sm text-muted-foreground">Apply a beautiful gradient mask to the QR code.</p>
                  </div>
                  <Switch checked={useGradient} onCheckedChange={setUseGradient} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {useGradient ? (
                    <>
                      <div className="space-y-3">
                        <Label>Gradient Start</Label>
                        <ColorPickerPopover 
                          color={style.gradient?.colorStart || "#8b5cf6"} 
                          onChange={(c) => setStyle(s => ({ ...s, gradient: { ...s.gradient!, colorStart: c } }))} 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Gradient End</Label>
                        <ColorPickerPopover 
                          color={style.gradient?.colorEnd || "#d946ef"} 
                          onChange={(c) => setStyle(s => ({ ...s, gradient: { ...s.gradient!, colorEnd: c } }))} 
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 sm:col-span-2">
                      <Label>Foreground Color</Label>
                      <ColorPickerPopover 
                        color={style.fgColor || "#ffffff"} 
                        onChange={(c) => setStyle(s => ({ ...s, fgColor: c }))} 
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <Label>Background Color</Label>
                  <ColorPickerPopover 
                    color={style.bgColor || "#121217"} 
                    onChange={(c) => setStyle(s => ({ ...s, bgColor: c }))} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-4">
                  <Label>Logo Image URL (Optional)</Label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                      <Input 
                        placeholder="https://example.com/logo.png" 
                        value={style.logoUrl || ""}
                        onChange={e => setStyle(s => ({ ...s, logoUrl: e.target.value }))}
                        className="bg-black/40 border-white/10 h-12 pl-11 rounded-xl"
                      />
                    </div>
                  </div>
                  {style.logoUrl && (
                    <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5 mt-4">
                      <div className="flex justify-between">
                        <Label>Logo Size</Label>
                        <span className="text-xs text-muted-foreground">{Math.round((style.logoSize || 0.2) * 100)}%</span>
                      </div>
                      <Slider 
                        min={0.1} max={0.4} step={0.05} 
                        value={[style.logoSize || 0.2]} 
                        onValueChange={([v]) => setStyle(s => ({ ...s, logoSize: v }))} 
                        className="py-2"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <Label>Error Correction Level</Label>
                  <p className="text-sm text-muted-foreground mb-4">Higher levels allow the QR code to be readable even if part of it is covered (like by a logo).</p>
                  <div className="grid grid-cols-4 gap-3">
                    {['L', 'M', 'Q', 'H'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setStyle(s => ({ ...s, errorCorrectionLevel: level as any }))}
                        className={`py-3 rounded-xl border font-medium transition-all ${
                          style.errorCorrectionLevel === level
                            ? 'bg-primary/20 border-primary text-white' 
                            : 'bg-black/20 border-white/5 text-muted-foreground hover:bg-white/10'
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

        {/* Right Column: Sticky Preview & Actions */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-28 space-y-6">
            <QrPreview content={generatedContent} styleConfig={style} />
            
            <div className="glass-card rounded-[2rem] p-6 space-y-4">
              <Button 
                onClick={handleSave} 
                disabled={createMutation.isPending}
                className="w-full h-14 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 border-0 text-white transition-transform active:scale-[0.98]"
              >
                {createMutation.isPending ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" /> Save to History
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleExport('png')} 
                  variant="outline" 
                  className="h-12 rounded-xl bg-black/40 border-white/10 hover:bg-white/10 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" /> PNG
                </Button>
                <Button 
                  onClick={() => handleExport('svg')} 
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
