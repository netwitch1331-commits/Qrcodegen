export interface LocalQrCode {
  id: string;
  name: string;
  type: string;
  content: string;
  style: Record<string, unknown>;
  isDynamic: boolean;
  scans: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "qreate_codes";

export function loadQrCodes(): LocalQrCode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalQrCode[];
  } catch {
    return [];
  }
}

export function saveQrCode(qr: Omit<LocalQrCode, "id" | "scans" | "createdAt" | "updatedAt">): LocalQrCode {
  const codes = loadQrCodes();
  const now = new Date().toISOString();
  const newCode: LocalQrCode = {
    ...qr,
    id: `qr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    scans: 0,
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newCode, ...codes]));
  return newCode;
}

export function deleteQrCode(id: string): void {
  const codes = loadQrCodes().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

export function updateQrCodeName(id: string, name: string): void {
  const codes = loadQrCodes().map((c) =>
    c.id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}
