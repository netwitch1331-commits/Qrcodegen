import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { QrCodeStyle } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface QrPreviewProps {
  content: string;
  styleConfig: QrCodeStyle;
}

export function QrPreview({ content, styleConfig }: QrPreviewProps) {
  const [qrMaskUrl, setQrMaskUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const generateQr = async () => {
      setIsGenerating(true);
      try {
        // Generate a black QR code with transparent background to use as a CSS mask
        const url = await QRCode.toDataURL(content || "https://qreate.app", {
          margin: 2,
          width: 800, // high res for sharpness
          color: { dark: "#000000", light: "#00000000" },
          errorCorrectionLevel: styleConfig.errorCorrectionLevel || "M"
        });
        
        if (isMounted) {
          setQrMaskUrl(`url(${url})`);
        }
      } catch (error) {
        console.error("QR Generation failed", error);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    // Debounce slightly to prevent lag while typing
    const timeout = setTimeout(generateQr, 300);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [content, styleConfig.errorCorrectionLevel]);

  // Determine foreground styling
  const fgStyle: React.CSSProperties = {};
  if (styleConfig.gradient && styleConfig.gradient.colorStart && styleConfig.gradient.colorEnd) {
    const isRadial = styleConfig.gradient.type === 'radial';
    const angle = styleConfig.gradient.rotation || 90;
    const c1 = styleConfig.gradient.colorStart;
    const c2 = styleConfig.gradient.colorEnd;
    
    fgStyle.background = isRadial 
      ? `radial-gradient(circle at center, ${c1}, ${c2})`
      : `linear-gradient(${angle}deg, ${c1}, ${c2})`;
  } else {
    fgStyle.background = styleConfig.fgColor || "#ffffff";
  }

  // Determine logo layout
  const logoSize = styleConfig.logoSize ? styleConfig.logoSize * 100 : 20;

  return (
    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden glass-card flex items-center justify-center p-8 sm:p-12 transition-all duration-500 hover:shadow-primary/20">
      {/* Background layer */}
      <div 
        className="absolute inset-0 transition-colors duration-500" 
        style={{ backgroundColor: styleConfig.bgColor || "#121217" }} 
      />
      
      {/* The QR Code mapped via CSS Mask */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={qrMaskUrl}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {qrMaskUrl ? (
            <>
              {/* The actual colored QR code */}
              <div 
                className="absolute inset-0 qr-mask transition-all duration-300"
                style={{ 
                  ...fgStyle,
                  maskImage: qrMaskUrl,
                  WebkitMaskImage: qrMaskUrl
                }}
              />
              
              {/* Optional Logo */}
              {styleConfig.logoUrl && (
                <div 
                  className="absolute z-10 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center p-2"
                  style={{ 
                    width: `${logoSize}%`, 
                    height: `${logoSize}%`,
                    backgroundColor: styleConfig.bgColor || "#121217"
                  }}
                >
                  <img 
                    src={styleConfig.logoUrl} 
                    alt="QR Logo" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              )}
            </>
          ) : (
            <Skeleton className="w-full h-full rounded-2xl opacity-20" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Loading overlay indicator */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
