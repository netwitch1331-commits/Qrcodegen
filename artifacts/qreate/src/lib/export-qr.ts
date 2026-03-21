import QRCode from 'qrcode';
import type { QrCodeStyle } from '@workspace/api-client-react';

export async function exportQrCode(content: string, style: QrCodeStyle, format: 'png' | 'svg' = 'png', size: number = 1000) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    // 1. Draw Background
    ctx.fillStyle = style.bgColor || '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // 2. Generate Base QR Code (Black on Transparent)
    const qrDataUrl = await QRCode.toDataURL(content || 'https://qreate.app', {
      margin: 2,
      width: size,
      color: { dark: '#000000', light: '#00000000' },
      errorCorrectionLevel: style.errorCorrectionLevel || 'M'
    });

    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve;
      qrImage.onerror = reject;
    });

    // 3. Draw QR Code with color/gradient
    ctx.drawImage(qrImage, 0, 0, size, size);
    
    // Apply composite operation to color the black QR code pixels
    ctx.globalCompositeOperation = 'source-in';

    if (style.gradient && style.gradient.colorStart && style.gradient.colorEnd) {
      const isRadial = style.gradient.type === 'radial';
      let grad;
      
      if (isRadial) {
        grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      } else {
        // Calculate rotation for linear gradient (simplified)
        const angle = (style.gradient.rotation || 0) * (Math.PI / 180);
        const x2 = size/2 + Math.cos(angle) * size/2;
        const y2 = size/2 + Math.sin(angle) * size/2;
        const x1 = size/2 - Math.cos(angle) * size/2;
        const y1 = size/2 - Math.sin(angle) * size/2;
        grad = ctx.createLinearGradient(x1, y1, x2, y2);
      }
      
      grad.addColorStop(0, style.gradient.colorStart);
      grad.addColorStop(1, style.gradient.colorEnd);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = style.fgColor || '#000000';
    }
    
    ctx.fillRect(0, 0, size, size);
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    // 4. Draw Logo if present
    if (style.logoUrl) {
      const logoImage = new Image();
      logoImage.crossOrigin = "anonymous"; // Try to avoid CORS issues
      logoImage.src = style.logoUrl;
      
      try {
        await new Promise((resolve, reject) => {
          logoImage.onload = resolve;
          logoImage.onerror = reject;
        });
        
        const logoSizeRatio = style.logoSize || 0.2;
        const targetLogoSize = size * logoSizeRatio;
        const offset = (size - targetLogoSize) / 2;
        
        // Draw a background behind logo for better readability
        ctx.fillStyle = style.bgColor || '#ffffff';
        ctx.beginPath();
        ctx.roundRect(offset - 10, offset - 10, targetLogoSize + 20, targetLogoSize + 20, 20);
        ctx.fill();
        
        // Draw logo
        ctx.drawImage(logoImage, offset, offset, targetLogoSize, targetLogoSize);
      } catch (e) {
        console.warn("Failed to load logo for export", e);
      }
    }

    // 5. Trigger Download
    const link = document.createElement('a');
    link.download = `qreate-${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
}
