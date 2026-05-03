export interface Donor {
  id: string;
  fullName: string;
  gender: string;
  department: string;
  year: string;
  bloodGroup: string;
  lastDonated: string;
  address: string;
  phone: string;
  createdAt: string;
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
export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAdmin(username: string, password: string): boolean {
  if (username === "Admin" && password === "admin2026") {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_KEY);
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
