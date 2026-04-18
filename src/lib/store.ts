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

const ADMIN_KEY = "bloodbank_admin";

// Mappers between DB rows (snake_case) and app models (camelCase)
type DonorRow = {
  id: string;
  full_name: string;
  gender: string;
  department: string;
  year: string;
  blood_group: string;
  last_donated: string;
  address: string;
  phone: string;
  created_at: string;
};

function mapDonor(r: DonorRow): Donor {
  return {
    id: r.id,
    fullName: r.full_name,
    gender: r.gender || "",
    department: r.department,
    year: r.year,
    bloodGroup: r.blood_group,
    lastDonated: r.last_donated || "",
    address: r.address || "",
    phone: r.phone,
    createdAt: r.created_at,
  };
}

type RequestRow = {
  id: string;
  requester_name: string;
  blood_group: string;
  phone: string;
  urgency: string;
  hospital_name: string;
  hospital_location: string;
  donated: boolean;
  donated_date: string;
  created_at: string;
};

function mapRequest(r: RequestRow): BloodRequest {
  return {
    id: r.id,
    requesterName: r.requester_name,
    bloodGroup: r.blood_group,
    phone: r.phone,
    urgency: r.urgency || "",
    hospitalName: r.hospital_name || "",
    hospitalLocation: r.hospital_location || "",
    createdAt: r.created_at,
    donated: r.donated,
    donatedDate: r.donated_date || "",
  };
}

// ===== Donors =====
export async function getDonors(): Promise<Donor[]> {
  const { data, error } = await supabase
    .from("donors")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DonorRow[]).map(mapDonor);
}

export async function saveDonor(donor: Omit<Donor, "id" | "createdAt">): Promise<Donor> {
  const { data, error } = await supabase
    .from("donors")
    .insert({
      full_name: donor.fullName,
      gender: donor.gender,
      department: donor.department,
      year: donor.year,
      blood_group: donor.bloodGroup,
      last_donated: donor.lastDonated,
      address: donor.address,
      phone: donor.phone,
    })
    .select()
    .single();
  if (error) throw error;
  return mapDonor(data as DonorRow);
}

export async function updateDonor(id: string, donor: Omit<Donor, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase
    .from("donors")
    .update({
      full_name: donor.fullName,
      gender: donor.gender,
      department: donor.department,
      year: donor.year,
      blood_group: donor.bloodGroup,
      last_donated: donor.lastDonated,
      address: donor.address,
      phone: donor.phone,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDonor(id: string): Promise<void> {
  const { error } = await supabase.from("donors").delete().eq("id", id);
  if (error) throw error;
}

// ===== Blood Requests =====
export async function getRequests(): Promise<BloodRequest[]> {
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as RequestRow[]).map(mapRequest);
}

export async function saveRequest(req: Omit<BloodRequest, "id" | "createdAt">): Promise<BloodRequest> {
  const { data, error } = await supabase
    .from("blood_requests")
    .insert({
      requester_name: req.requesterName,
      blood_group: req.bloodGroup,
      phone: req.phone,
      urgency: req.urgency,
      hospital_name: req.hospitalName,
      hospital_location: req.hospitalLocation,
      donated: req.donated ?? false,
      donated_date: req.donatedDate ?? "",
    })
    .select()
    .single();
  if (error) throw error;
  return mapRequest(data as RequestRow);
}

export async function deleteRequest(id: string): Promise<void> {
  const { error } = await supabase.from("blood_requests").delete().eq("id", id);
  if (error) throw error;
}

export async function markRequestDonated(id: string, donatedDate: string): Promise<void> {
  const { error } = await supabase
    .from("blood_requests")
    .update({ donated: true, donated_date: donatedDate })
    .eq("id", id);
  if (error) throw error;
}

// ===== Admin (client-side only) =====
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
