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
}

const DONORS_KEY = "bloodbank_donors";
const REQUESTS_KEY = "bloodbank_requests";
const ADMIN_KEY = "bloodbank_admin";

export function getDonors(): Donor[] {
  const data = localStorage.getItem(DONORS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveDonor(donor: Omit<Donor, "id" | "createdAt">): Donor {
  const donors = getDonors();
  const newDonor: Donor = {
    ...donor,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  donors.push(newDonor);
  localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
  return newDonor;
}

export function updateDonor(id: string, data: Omit<Donor, "id" | "createdAt">): void {
  const donors = getDonors();
  const idx = donors.findIndex((d) => d.id === id);
  if (idx !== -1) {
    donors[idx] = { ...donors[idx], ...data };
    localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
  }
}

export function deleteDonor(id: string): void {
  const donors = getDonors().filter((d) => d.id !== id);
  localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
}

export function getRequests(): BloodRequest[] {
  const data = localStorage.getItem(REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveRequest(req: Omit<BloodRequest, "id" | "createdAt">): BloodRequest {
  const requests = getRequests();
  const newReq: BloodRequest = {
    ...req,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  requests.push(newReq);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  return newReq;
}

export function deleteRequest(id: string): void {
  const requests = getRequests().filter((r) => r.id !== id);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAdmin(username: string, password: string): boolean {
  if (username === "admin" && password === "admin2026") {
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
