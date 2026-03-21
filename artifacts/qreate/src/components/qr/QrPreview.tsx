import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { QrCodeStyle } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

export type FrameStyle = "none" | "simple" | "rounded" | "double" | "corners" | "scan" | "dots" | "neon";

export type ExtendedQrStyle = QrCodeStyle & {
  frameStyle?: FrameStyle;
  frameColor?: string;
  caption?: string;
  captionColor?: string;
};

interface QrPreviewProps {
  content: string;
  styleConfig: ExtendedQrStyle;
  onGenerated?: () => void;
}

function getFgColor(style: ExtendedQrStyle): string {
  if (style.gradient?.colorStart) return style.gradient.colorStart;
  return style.fgColor || "#8b5cf6";
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  qrX: number,
  qrY: number,
  qrSize: number,
  frameStyle: FrameStyle,
  frameColor: string,
  bgColor: string,
  style: ExtendedQrStyle,
) {
  const fc = frameColor;
  ctx.save();

  switch (frameStyle) {
    case "simple": {
      ctx.strokeStyle = fc;
      ctx.lineWidth = 12;
      ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
      break;
    }

    case "rounded": {
      const r = 48;
      const x = qrX - 30;
      const y = qrY - 30;
      const w = qrSize + 60;
      const h = qrSize + 60;
      ctx.strokeStyle = fc;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.stroke();
      break;
    }

    case "double": {
      ctx.strokeStyle = fc;
      ctx.lineWidth = 8;
      ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 34, qrY - 34, qrSize + 68, qrSize + 68);
      break;
    }

    case "corners": {
      const arm = 80;
      const thick = 18;
      const gap = 28;
      const corners: [number, number, number, number][] = [
        [qrX - gap, qrY - gap, 1, 1],
        [qrX + qrSize + gap, qrY - gap, -1, 1],
        [qrX - gap, qrY + qrSize + gap, 1, -1],
        [qrX + qrSize + gap, qrY + qrSize + gap, -1, -1],
      ];
      ctx.fillStyle = fc;
      for (const [cx, cy, dx, dy] of corners) {
        ctx.fillRect(cx, cy, dx * arm, dy * thick);
        ctx.fillRect(cx, cy, dx * thick, dy * arm);
      }
      break;
    }

    case "scan": {
      const r = 40;
      const padX = qrX - 32;
      const padY = qrY - 32;
      const padW = qrSize + 64;
      const labelH = 110;
      const totalH = padW + labelH;

      ctx.strokeStyle = fc;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.roundRect(padX, padY, padW, totalH, r);
      ctx.stroke();

      ctx.fillStyle = fc;
      ctx.beginPath();
      ctx.roundRect(padX, padY + padW, padW, labelH, [0, 0, r, r]);
      ctx.fill();

      ctx.fillStyle = bgColor;
      ctx.font = `bold ${Math.round(padW * 0.085)}px 'Outfit', 'DM Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("СКАНИРУЙ МЕНЯ", padX + padW / 2, padY + padW + labelH / 2);
      break;
    }

    case "dots": {
      ctx.strokeStyle = fc;
      ctx.lineWidth = 10;
      ctx.setLineDash([18, 16]);
      ctx.lineDashOffset = 0;
      const r = 32;
      ctx.beginPath();
      ctx.roundRect(qrX - 28, qrY - 28, qrSize + 56, qrSize + 56, r);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }

    case "neon": {
      const r = 36;
      const x = qrX - 26;
      const y = qrY - 26;
      const w = qrSize + 52;
      const h = qrSize + 52;

      const glowColors = [
        { blur: 40, alpha: 0.35 },
        { blur: 20, alpha: 0.55 },
        { blur: 8, alpha: 0.9 },
        { blur: 0, alpha: 1 },
      ];

      for (const g of glowColors) {
        ctx.shadowColor = fc;
        ctx.shadowBlur = g.blur;
        ctx.strokeStyle = fc + Math.round(g.alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      break;
    }

    default:
      break;
  }

  ctx.restore();
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
        const frameStyle: FrameStyle = (styleConfig as ExtendedQrStyle).frameStyle || "none";
        const bgColor = styleConfig.bgColor || "#121217";
        const frameColor = (styleConfig as ExtendedQrStyle).frameColor || getFgColor(styleConfig);
        const caption = (styleConfig as ExtendedQrStyle).caption?.trim() || "";
        const captionColor = (styleConfig as ExtendedQrStyle).captionColor || getFgColor(styleConfig);

        // Canvas dimensions
        const canvasSize = 960;
        const padding = frameStyle === "none" ? 0 : 130;
        const labelExtra = frameStyle === "scan" ? 140 : 0;
        const qrSize = canvasSize - padding * 2;
        const captionFontSize = Math.round(canvasSize * 0.055);
        const captionExtra = caption ? captionFontSize * 2.4 : 0;
        const canvasH = canvasSize + labelExtra + captionExtra;
        const qrX = padding;
        const qrY = padding;

        canvas.width = canvasSize;
        canvas.height = canvasH;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasSize, canvasH);

        // Generate QR
        const qrDataUrl = await QRCode.toDataURL(content || "https://qreate.app", {
          margin: 2,
          width: qrSize,
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

        // Colorise QR via temp canvas
        const tmp = document.createElement("canvas");
        tmp.width = qrSize;
        tmp.height = qrSize;
        const tc = tmp.getContext("2d")!;

        tc.clearRect(0, 0, qrSize, qrSize);
        tc.drawImage(qrImg, 0, 0, qrSize, qrSize);
        tc.globalCompositeOperation = "source-in";

        if (styleConfig.gradient?.colorStart && styleConfig.gradient?.colorEnd) {
          let grad: CanvasGradient;
          if (styleConfig.gradient.type === "radial") {
            grad = tc.createRadialGradient(qrSize / 2, qrSize / 2, 0, qrSize / 2, qrSize / 2, qrSize / 2);
          } else {
            const angleDeg = styleConfig.gradient.rotation ?? 135;
            const angle = (angleDeg * Math.PI) / 180;
            const cx = qrSize / 2;
            const cy = qrSize / 2;
            const r = qrSize / 2;
            grad = tc.createLinearGradient(
              cx - Math.cos(angle) * r,
              cy - Math.sin(angle) * r,
              cx + Math.cos(angle) * r,
              cy + Math.sin(angle) * r,
            );
          }
          grad.addColorStop(0, styleConfig.gradient.colorStart);
          grad.addColorStop(1, styleConfig.gradient.colorEnd);
          tc.fillStyle = grad;
        } else {
          tc.fillStyle = styleConfig.fgColor || "#ffffff";
        }
        tc.fillRect(0, 0, qrSize, qrSize);

        // Draw colored QR
        ctx.drawImage(tmp, qrX, qrY, qrSize, qrSize);

        // Logo overlay
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
            const lSize = qrSize * ratio;
            const lOff = (qrSize - lSize) / 2;
            const pad = 14;
            ctx.fillStyle = bgColor;
            const rx = qrX + lOff - pad;
            const ry = qrY + lOff - pad;
            const rw = lSize + pad * 2;
            const rh = lSize + pad * 2;
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, 14);
            ctx.fill();
            ctx.drawImage(logo, qrX + lOff, qrY + lOff, lSize, lSize);
          } catch {
            // non-critical
          }
        }

        // Frame
        if (frameStyle !== "none") {
          drawFrame(ctx, canvasSize, canvasH, qrX, qrY, qrSize, frameStyle, frameColor, bgColor, styleConfig);
        }

        // Caption text below QR
        if (caption) {
          const textY = canvasSize + labelExtra + captionExtra / 2;
          ctx.save();
          ctx.font = `bold ${captionFontSize}px 'Outfit', 'DM Sans', 'Inter', sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = captionColor;
          ctx.fillText(caption, canvasSize / 2, textY);
          ctx.restore();
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
    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden glass-card flex items-center justify-center p-4">
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
        style={{ imageRendering: "auto" }}
      />

      {!hasGenerated && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
        </div>
      )}
    </div>
  );
}
