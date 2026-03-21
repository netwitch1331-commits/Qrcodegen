import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { QrCodeStyle } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

interface QrPreviewProps {
  content: string;
  styleConfig: QrCodeStyle;
  onGenerated?: () => void;
}

export function QrPreview({ content, styleConfig, onGenerated }: QrPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const generateQr = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setIsGenerating(true);

      try {
        const size = 800;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);

        const qrDataUrl = await QRCode.toDataURL(content || "https://qreate.app", {
          margin: 2,
          width: size,
          color: { dark: "#000000ff", light: "#00000000" },
          errorCorrectionLevel: (styleConfig.errorCorrectionLevel as "L" | "M" | "Q" | "H") || "H",
        });

        if (!isMounted) return;

        const qrImg = new Image();
        await new Promise<void>((resolve, reject) => {
          qrImg.onload = () => resolve();
          qrImg.onerror = reject;
          qrImg.src = qrDataUrl;
        });

        if (!isMounted) return;

        ctx.drawImage(qrImg, 0, 0, size, size);
        ctx.globalCompositeOperation = "source-in";

        if (styleConfig.gradient?.colorStart && styleConfig.gradient?.colorEnd) {
          let grad: CanvasGradient;
          if (styleConfig.gradient.type === "radial") {
            grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
          } else {
            const angleDeg = styleConfig.gradient.rotation ?? 135;
            const angle = (angleDeg * Math.PI) / 180;
            const cx = size / 2;
            const cy = size / 2;
            const r = size / 2;
            grad = ctx.createLinearGradient(
              cx - Math.cos(angle) * r,
              cy - Math.sin(angle) * r,
              cx + Math.cos(angle) * r,
              cy + Math.sin(angle) * r,
            );
          }
          grad.addColorStop(0, styleConfig.gradient.colorStart);
          grad.addColorStop(1, styleConfig.gradient.colorEnd);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = styleConfig.fgColor || "#ffffff";
        }

        ctx.fillRect(0, 0, size, size);

        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = styleConfig.bgColor || "#121217";
        ctx.fillRect(0, 0, size, size);

        ctx.globalCompositeOperation = "source-over";

        if (styleConfig.logoUrl) {
          try {
            const logo = new Image();
            logo.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              logo.onload = () => resolve();
              logo.onerror = reject;
              logo.src = styleConfig.logoUrl!;
            });

            const ratio = styleConfig.logoSize ?? 0.2;
            const logoSize = size * ratio;
            const offset = (size - logoSize) / 2;
            const pad = 16;

            ctx.fillStyle = styleConfig.bgColor || "#121217";
            ctx.beginPath();
            const r = 16;
            const x = offset - pad;
            const y = offset - pad;
            const w = logoSize + pad * 2;
            const h = logoSize + pad * 2;
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();

            ctx.drawImage(logo, offset, offset, logoSize, logoSize);
          } catch {
            // некритичная ошибка загрузки логотипа
          }
        }

        if (isMounted) {
          setHasGenerated(true);
          onGenerated?.();
        }
      } catch (error) {
        console.error("Ошибка генерации QR-кода:", error);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    const timeout = setTimeout(generateQr, 250);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [content, styleConfig]);

  return (
    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden glass-card flex items-center justify-center p-6">
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-sm"
          >
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.canvas
        ref={canvasRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: hasGenerated ? 1 : 0, scale: hasGenerated ? 1 : 0.95 }}
        transition={{ duration: 0.4 }}
        className="w-full h-full object-contain rounded-2xl"
        style={{ imageRendering: "pixelated" }}
      />

      {!hasGenerated && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
        </div>
      )}
    </div>
  );
}
