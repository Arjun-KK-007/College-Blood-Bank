export interface Donor {
  id: string;
  fullName: string;
  gender: string;
  department: string;
  year: string;
  bloodGroup: string;
  lastDonated: string;
  address: string;
  city?: string;
  phone: string;
  createdAt: string;
}

export function getDonorCity(d: Donor): string {
  if (d.city) return d.city;
  // fallback: try to extract from comma-separated address (doorNo, area, city, district)
  const parts = (d.address || "").split(",").map((s) => s.trim()).filter(Boolean);
  return parts[2] || parts[parts.length - 1] || "";
}

export interface BloodRequest {
  id: string;
  requesterName: string;
  bloodGroup: string;
  phone: string;
  urgency: string;
  hospitalName: string;
  hospitalLocation: string;
  createdAt: string;
  donated?: boolean;
  donatedDate?: string;
}

const DONORS_KEY = "bloodbank_donors";
const REQUESTS_KEY = "bloodbank_requests";
const ADMIN_KEY = "bloodbank_admin";
const SIGNED_IN_KEY = "bloodbank_donor_phone";

export function getSignedInPhone(): string {
  return localStorage.getItem(SIGNED_IN_KEY) || "";
}
export function setSignedInPhone(phone: string): void {
  localStorage.setItem(SIGNED_IN_KEY, normalizePhone(phone));
}
export function clearSignedInPhone(): void {
  localStorage.removeItem(SIGNED_IN_KEY);
}

function readArr<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}
function writeArr<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function normalizePhone(p: string): string {
  return (p || "").replace(/\D/g, "");
}

// ===== Donors =====
export async function getDonors(): Promise<Donor[]> {
  return readArr<Donor>(DONORS_KEY).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function getDonorByPhone(phone: string): Promise<Donor | null> {
  const target = normalizePhone(phone);
  const donors = readArr<Donor>(DONORS_KEY);
  return donors.find((d) => normalizePhone(d.phone) === target) || null;
}

export async function saveDonor(donor: Omit<Donor, "id" | "createdAt">): Promise<Donor> {
  const donors = readArr<Donor>(DONORS_KEY);
  const target = normalizePhone(donor.phone);
  if (donors.some((d) => normalizePhone(d.phone) === target)) {
    throw new Error("This phone number is already registered as a donor.");
  }
  const newDonor: Donor = { ...donor, id: uid(), createdAt: new Date().toISOString() };
  donors.push(newDonor);
  writeArr(DONORS_KEY, donors);
  return newDonor;
}

export async function updateDonor(id: string, donor: Omit<Donor, "id" | "createdAt">): Promise<void> {
  const donors = readArr<Donor>(DONORS_KEY);
  const idx = donors.findIndex((d) => d.id === id);
  if (idx === -1) return;
  donors[idx] = { ...donors[idx], ...donor };
  writeArr(DONORS_KEY, donors);
}

export async function updateDonorLastDonated(id: string, lastDonated: string): Promise<void> {
  const donors = readArr<Donor>(DONORS_KEY);
  const idx = donors.findIndex((d) => d.id === id);
  if (idx === -1) return;
  donors[idx].lastDonated = lastDonated;
  writeArr(DONORS_KEY, donors);
}

export async function deleteDonor(id: string): Promise<void> {
  writeArr(DONORS_KEY, readArr<Donor>(DONORS_KEY).filter((d) => d.id !== id));
}

// ===== Blood Requests =====
export async function getRequests(): Promise<BloodRequest[]> {
  return readArr<BloodRequest>(REQUESTS_KEY).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function saveRequest(req: Omit<BloodRequest, "id" | "createdAt">): Promise<BloodRequest> {
  const requests = readArr<BloodRequest>(REQUESTS_KEY);
  const newReq: BloodRequest = { ...req, id: uid(), createdAt: new Date().toISOString(), donated: req.donated ?? false, donatedDate: req.donatedDate ?? "" };
  requests.push(newReq);
  writeArr(REQUESTS_KEY, requests);
  return newReq;
}

export async function updateRequest(id: string, patch: Partial<Omit<BloodRequest, "id" | "createdAt">>): Promise<void> {
  const requests = readArr<BloodRequest>(REQUESTS_KEY);
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return;
  requests[idx] = { ...requests[idx], ...patch };
  writeArr(REQUESTS_KEY, requests);
}

export async function deleteRequest(id: string): Promise<void> {
  writeArr(REQUESTS_KEY, readArr<BloodRequest>(REQUESTS_KEY).filter((r) => r.id !== id));
}

export async function markRequestDonated(id: string, donatedDate: string): Promise<void> {
  await updateRequest(id, { donated: true, donatedDate });
}

// ===== Admin =====
const ADMIN_ATTEMPTS_KEY = "bloodbank_admin_attempts";
const ADMIN_LOCK_KEY = "bloodbank_admin_lock_until";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 minutes

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function getAdminLockRemaining(): number {
  const until = parseInt(localStorage.getItem(ADMIN_LOCK_KEY) || "0", 10);
  return Math.max(0, until - Date.now());
}

export function loginAdmin(username: string, password: string): { ok: boolean; error?: string } {
  const lockRemaining = getAdminLockRemaining();
  if (lockRemaining > 0) {
    return { ok: false, error: `Too many attempts. Try again in ${Math.ceil(lockRemaining / 1000)}s.` };
  }
  if (username === "Admin" && password === "admin2026/") {
    localStorage.setItem(ADMIN_KEY, "true");
    localStorage.removeItem(ADMIN_ATTEMPTS_KEY);
    localStorage.removeItem(ADMIN_LOCK_KEY);
    return { ok: true };
  }
  const attempts = parseInt(localStorage.getItem(ADMIN_ATTEMPTS_KEY) || "0", 10) + 1;
  localStorage.setItem(ADMIN_ATTEMPTS_KEY, String(attempts));
  if (attempts >= MAX_ATTEMPTS) {
    localStorage.setItem(ADMIN_LOCK_KEY, String(Date.now() + LOCK_MS));
    localStorage.removeItem(ADMIN_ATTEMPTS_KEY);
    return { ok: false, error: "Too many failed attempts. Locked for 5 minutes." };
  }
  return { ok: false, error: `Invalid credentials. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.` };
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_KEY);
}

// ===== OTP (demo: code shown to user, simulating SMS) =====
const OTP_KEY = "bloodbank_otp";
interface OtpRecord { phone: string; code: string; expiresAt: number; }

export function sendOtp(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const record: OtpRecord = { phone: normalizePhone(phone), code, expiresAt: Date.now() + 5 * 60 * 1000 };
  localStorage.setItem(OTP_KEY, JSON.stringify(record));
  return code;
}

export async function sendOtpSms(phone: string, purpose: "signin" | "edit_request"): Promise<{ ok: boolean; error?: string }> {
  const code = sendOtp(phone);
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { phone: normalizePhone(phone), code, purpose },
    });
    if (error || (data && (data as { error?: string }).error)) {
      return { ok: false, error: error?.message || (data as { error?: string }).error || "Failed to send SMS" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}


export function verifyOtp(phone: string, code: string): boolean {
  try {
    const raw = localStorage.getItem(OTP_KEY);
    if (!raw) return false;
    const rec = JSON.parse(raw) as OtpRecord;
    if (rec.expiresAt < Date.now()) return false;
    if (rec.phone !== normalizePhone(phone)) return false;
    if (rec.code !== code.trim()) return false;
    localStorage.removeItem(OTP_KEY);
    return true;
  } catch {
    return false;
  }
}

export function maskPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length < 4) return "••••";
  return "••••••" + digits.slice(-4);
}

export const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Information Technology",
  "Chemical",
  "Biotechnology",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const YEARS = ["1st", "2nd", "3rd", "4th"];
export const GENDERS = ["Male", "Female", "Other"];
