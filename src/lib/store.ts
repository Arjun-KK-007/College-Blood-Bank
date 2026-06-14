import { supabase } from "@/integrations/supabase/client";

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

export function normalizePhone(p: string): string {
  return (p || "").replace(/\D/g, "");
}

// Convert Supabase row to Donor interface
function rowToDonor(row: Record<string, unknown>): Donor {
  return {
    id: row.id,
    fullName: row.full_name,
    gender: row.gender,
    department: row.department,
    year: row.year,
    bloodGroup: row.blood_group,
    lastDonated: row.last_donated,
    address: row.address,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

// Convert Donor interface to Supabase insert/update format
function donorToRow(donor: Omit<Donor, "id" | "createdAt">) {
  return {
    full_name: donor.fullName,
    gender: donor.gender,
    department: donor.department,
    year: donor.year,
    blood_group: donor.bloodGroup,
    last_donated: donor.lastDonated,
    address: donor.address,
    phone: donor.phone,
  };
}

// Convert Supabase row to BloodRequest interface
function rowToBloodRequest(row: Record<string, unknown>): BloodRequest {
  return {
    id: row.id,
    requesterName: row.requester_name,
    bloodGroup: row.blood_group,
    phone: row.phone,
    urgency: row.urgency,
    hospitalName: row.hospital_name,
    hospitalLocation: row.hospital_location,
    createdAt: row.created_at,
    donated: row.donated ?? false,
    donatedDate: row.donated_date ?? "",
  };
}

// Convert BloodRequest to Supabase insert/update format
function bloodRequestToRow(req: Omit<BloodRequest, "id" | "createdAt">) {
  return {
    requester_name: req.requesterName,
    blood_group: req.bloodGroup,
    phone: req.phone,
    urgency: req.urgency,
    hospital_name: req.hospitalName,
    hospital_location: req.hospitalLocation,
    donated: req.donated ?? false,
    donated_date: req.donatedDate ?? "",
  };
}

// ===== Donors =====
export async function getDonors(): Promise<Donor[]> {
  const { data, error } = await supabase
    .from("donors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching donors:", error);
    return [];
  }

  return (data || []).map(rowToDonor);
}

export async function getDonorByPhone(phone: string): Promise<Donor | null> {
  const target = normalizePhone(phone);
  const { data, error } = await supabase
    .from("donors")
    .select("*")
    .eq("phone", target)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching donor by phone:", error);
  }

  return data ? rowToDonor(data) : null;
}

export async function saveDonor(donor: Omit<Donor, "id" | "createdAt">): Promise<Donor> {
  const target = normalizePhone(donor.phone);
  
  // Check if phone already exists
  const existing = await getDonorByPhone(target);
  if (existing) {
    throw new Error("This phone number is already registered as a donor.");
  }

  const { data, error } = await supabase
    .from("donors")
    .insert([donorToRow(donor)])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to save donor");
  }

  return rowToDonor(data);
}

export async function updateDonor(id: string, donor: Omit<Donor, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase
    .from("donors")
    .update(donorToRow(donor))
    .eq("id", id);

  if (error) {
    console.error("Error updating donor:", error);
    throw new Error(error.message || "Failed to update donor");
  }
}

export async function updateDonorLastDonated(id: string, lastDonated: string): Promise<void> {
  const { error } = await supabase
    .from("donors")
    .update({ last_donated: lastDonated })
    .eq("id", id);

  if (error) {
    console.error("Error updating donor last donated:", error);
    throw new Error(error.message || "Failed to update last donated date");
  }
}

export async function deleteDonor(id: string): Promise<void> {
  const { error } = await supabase
    .from("donors")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting donor:", error);
    throw new Error(error.message || "Failed to delete donor");
  }
}

// ===== Blood Requests =====
export async function getRequests(): Promise<BloodRequest[]> {
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching blood requests:", error);
    return [];
  }

  return (data || []).map(rowToBloodRequest);
}

export async function saveRequest(req: Omit<BloodRequest, "id" | "createdAt">): Promise<BloodRequest> {
  const { data, error } = await supabase
    .from("blood_requests")
    .insert([bloodRequestToRow(req)])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to save blood request");
  }

  return rowToBloodRequest(data);
}

export async function updateRequest(id: string, patch: Partial<Omit<BloodRequest, "id" | "createdAt">>): Promise<void> {
  // Convert camelCase patch to snake_case
  const updateData: Record<string, unknown> = {};
  if (patch.requesterName !== undefined) updateData.requester_name = patch.requesterName;
  if (patch.bloodGroup !== undefined) updateData.blood_group = patch.bloodGroup;
  if (patch.phone !== undefined) updateData.phone = patch.phone;
  if (patch.urgency !== undefined) updateData.urgency = patch.urgency;
  if (patch.hospitalName !== undefined) updateData.hospital_name = patch.hospitalName;
  if (patch.hospitalLocation !== undefined) updateData.hospital_location = patch.hospitalLocation;
  if (patch.donated !== undefined) updateData.donated = patch.donated;
  if (patch.donatedDate !== undefined) updateData.donated_date = patch.donatedDate;

  const { error } = await supabase
    .from("blood_requests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating blood request:", error);
    throw new Error(error.message || "Failed to update blood request");
  }
}

export async function deleteRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from("blood_requests")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting blood request:", error);
    throw new Error(error.message || "Failed to delete blood request");
  }
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

// ===== OTP (legacy, retained for compatibility) =====
const OTP_KEY = "bloodbank_otp";
interface OtpRecord { phone: string; code: string; expiresAt: number; }

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
