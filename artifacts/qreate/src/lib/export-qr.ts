import QRCode from 'qrcode';
import type { QrCodeStyle } from '@workspace/api-client-react';
import type { ExtendedQrStyle } from '@/components/qr/QrPreview';

function getFgColor(style: ExtendedQrStyle): string {
  if (style.gradient?.colorStart) return style.gradient.colorStart;
  return style.fgColor || '#8b5cf6';
}

export async function exportQrCode(
  content: string,
  style: QrCodeStyle,
  format: 'png' | 'svg' = 'png',
  size: number = 1200,
) {
  try {
    const ext = style as ExtendedQrStyle;
    const frameStyle: FrameStyle = ext.frameStyle || 'none';
    const bgColor = style.bgColor || '#121217';
    const frameColor = ext.frameColor || getFgColor(ext);
    const caption = ext.caption?.trim() || '';
    const captionColor = ext.captionColor || getFgColor(ext);

    const padding = frameStyle === 'none' ? 0 : Math.round(size * 0.135);
    const labelExtra = frameStyle === 'scan' ? Math.round(size * 0.145) : 0;
    const captionFontSize = Math.round(size * 0.055);
    const captionExtra = caption ? Math.round(captionFontSize * 2.4) : 0;
    const qrSize = size - padding * 2;
    const canvasH = size + labelExtra + captionExtra;
    const qrX = padding;
    const qrY = padding;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, canvasH);

    // Generate QR
    const qrDataUrl = await QRCode.toDataURL(content || 'https://qreate.app', {
      margin: 2,
      width: qrSize,
      color: { dark: '#000000ff', light: '#00000000' },
      errorCorrectionLevel: (style.errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H') || 'H',
    });

    const qrImage = new Image();
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve;
      qrImage.onerror = reject;
      qrImage.src = qrDataUrl;
    });

    // Colorise via temp canvas
    const tmp = document.createElement('canvas');
    tmp.width = qrSize;
    tmp.height = qrSize;
    const tc = tmp.getContext('2d')!;
    tc.clearRect(0, 0, qrSize, qrSize);
    tc.drawImage(qrImage, 0, 0, qrSize, qrSize);
    tc.globalCompositeOperation = 'source-in';

    if (style.gradient?.colorStart && style.gradient?.colorEnd) {
      let grad: CanvasGradient;
      if (style.gradient.type === 'radial') {
        grad = tc.createRadialGradient(qrSize / 2, qrSize / 2, 0, qrSize / 2, qrSize / 2, qrSize / 2);
      } else {
        const angleDeg = style.gradient.rotation ?? 135;
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
      grad.addColorStop(0, style.gradient.colorStart);
      grad.addColorStop(1, style.gradient.colorEnd);
      tc.fillStyle = grad;
    } else {
      tc.fillStyle = style.fgColor || '#ffffff';
    }
    tc.fillRect(0, 0, qrSize, qrSize);

    ctx.drawImage(tmp, qrX, qrY, qrSize, qrSize);

    // Logo
    if (style.logoUrl) {
      try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = reject;
          logo.src = style.logoUrl!;
        });
        const ratio = style.logoSize ?? 0.2;
        const lSize = qrSize * ratio;
        const lOff = (qrSize - lSize) / 2;
        const pad = Math.round(size * 0.012);
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(qrX + lOff - pad, qrY + lOff - pad, lSize + pad * 2, lSize + pad * 2, 14);
        ctx.fill();
        ctx.drawImage(logo, qrX + lOff, qrY + lOff, lSize, lSize);
      } catch {
        // non-critical
      }
    }

    // Caption text
    if (caption) {
      const textY = size + labelExtra + captionExtra / 2;
      ctx.save();
      ctx.font = `bold ${captionFontSize}px 'Outfit', 'DM Sans', 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = captionColor;
      ctx.fillText(caption, size / 2, textY);
      ctx.restore();
    }

    // Download
    const link = document.createElement('a');
    link.download = `qreate-${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}
