/**
 * PIN unlock cho dashboard — lớp UX phía client để khỏi gõ email/password
 * mỗi lần truy cập. Hoạt động THÊM phía trên Supabase Auth, KHÔNG thay thế.
 *
 * Flow:
 *  1. User login đầy đủ qua Supabase 1 lần
 *  2. Lần đầu vào dashboard, PinGate hiện setup → user nhập 6 số → hash + lưu localStorage
 *  3. Lần sau, PinGate hiện unlock → user nhập PIN → match → vào dashboard
 *  4. Inactivity > 15 phút → lock lại
 *  5. Sai PIN 5 lần liên tiếp → xoá PIN local + force re-setup
 *
 * Mức bảo mật:
 *  - Server vẫn dùng Supabase Auth (đã được middleware check)
 *  - PIN chỉ là local gate trên browser → device bị stealing không bypass được nhanh
 *  - PIN hash với SHA-256 + random salt 16 byte (PBKDF2 100k iterations cho an toàn hơn)
 *  - Per-device — đổi browser hoặc xoá data thì phải setup lại
 */

const STORAGE_KEYS = {
  pinHash: 'ep_pin_hash',
  pinSalt: 'ep_pin_salt',
  failCount: 'ep_pin_fails',
  unlocked: 'ep_pin_unlocked',
  lastActivity: 'ep_pin_last_activity',
} as const;

const MAX_FAILS = 5;
const INACTIVITY_MS = 15 * 60 * 1000; // 15 phút

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveHash(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((h) => parseInt(h, 16)));
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    256
  );
  return bufferToHex(bits);
}

function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hasPin(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(STORAGE_KEYS.pinHash));
}

export async function setPin(pin: string): Promise<void> {
  const salt = randomSalt();
  const hash = await deriveHash(pin, salt);
  localStorage.setItem(STORAGE_KEYS.pinHash, hash);
  localStorage.setItem(STORAGE_KEYS.pinSalt, salt);
  localStorage.removeItem(STORAGE_KEYS.failCount);
  markUnlocked();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(STORAGE_KEYS.pinHash);
  const salt = localStorage.getItem(STORAGE_KEYS.pinSalt);
  if (!storedHash || !salt) return false;
  const hash = await deriveHash(pin, salt);
  const ok = hash === storedHash;
  if (ok) {
    localStorage.removeItem(STORAGE_KEYS.failCount);
    markUnlocked();
  } else {
    const fails = parseInt(localStorage.getItem(STORAGE_KEYS.failCount) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEYS.failCount, String(fails));
    if (fails >= MAX_FAILS) {
      // Wipe PIN — buộc setup lại sau lần login đầy đủ kế tiếp
      clearPin();
    }
  }
  return ok;
}

export function getFailCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEYS.failCount) || '0', 10);
}

export function clearPin(): void {
  localStorage.removeItem(STORAGE_KEYS.pinHash);
  localStorage.removeItem(STORAGE_KEYS.pinSalt);
  localStorage.removeItem(STORAGE_KEYS.failCount);
  sessionStorage.removeItem(STORAGE_KEYS.unlocked);
  sessionStorage.removeItem(STORAGE_KEYS.lastActivity);
}

export function markUnlocked(): void {
  sessionStorage.setItem(STORAGE_KEYS.unlocked, '1');
  touchActivity();
}

export function lock(): void {
  sessionStorage.removeItem(STORAGE_KEYS.unlocked);
  sessionStorage.removeItem(STORAGE_KEYS.lastActivity);
}

export function touchActivity(): void {
  sessionStorage.setItem(STORAGE_KEYS.lastActivity, String(Date.now()));
}

/**
 * Trả về true nếu user đang trong session unlock và chưa quá hạn inactivity.
 */
export function isUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(STORAGE_KEYS.unlocked) !== '1') return false;
  const last = parseInt(sessionStorage.getItem(STORAGE_KEYS.lastActivity) || '0', 10);
  if (!last) return false;
  if (Date.now() - last > INACTIVITY_MS) {
    lock();
    return false;
  }
  return true;
}

export const PIN_CONFIG = {
  MAX_FAILS,
  INACTIVITY_MS,
};
