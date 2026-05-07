import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEPARTMENTS,
  BLOOD_GROUPS,
  YEARS,
  GENDERS,
  saveDonor,
  getDonorByPhone,
  getSignedInPhone,
  setSignedInPhone,
  clearSignedInPhone,
  updateDonorLastDonated,
  sendOtpSms,
  verifyOtp,
  maskPhone,
  type Donor,
} from "@/lib/store";

type Mode = "signin" | "register" | "profile";

export default function Register() {
  const [mode, setMode] = useState<Mode>("signin");
  const [donor, setDonor] = useState<Donor | null>(null);
  const [signinPhone, setSigninPhone] = useState("");
  const [loading, setLoading] = useState(true);

  // OTP for sign-in
  const [otpStage, setOtpStage] = useState<"idle" | "verify">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpDevHint, setOtpDevHint] = useState("");
  const [pendingDonor, setPendingDonor] = useState<Donor | null>(null);

  // Update last donated dialog
  const [editOpen, setEditOpen] = useState(false);
  const [newLastDonated, setNewLastDonated] = useState("");

  // Registration form
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    department: "",
    year: "",
    bloodGroup: "",
    lastDonated: "",
    lastDonatedDate: "",
    doorNo: "",
    area: "",
    city: "",
    district: "",
    phone: "",
  });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const loadProfile = async (phone: string) => {
    const d = await getDonorByPhone(phone);
    if (d) {
      setDonor(d);
      setMode("profile");
    } else {
      clearSignedInPhone();
      setMode("signin");
    }
  };

  useEffect(() => {
    const stored = getSignedInPhone();
    if (stored) {
      loadProfile(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = signinPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    const found = await getDonorByPhone(phoneDigits);
    if (!found) {
      toast.error("No donor found with this phone number. Please register.");
      set("phone", phoneDigits);
      setMode("register");
      return;
    }
    // Send OTP via SMS
    const res = await sendOtpSms(phoneDigits, "signin");
    if (!res.ok) {
      toast.error(res.error || "Failed to send OTP");
      return;
    }
    setOtpDevHint("");
    setPendingDonor(found);
    setOtpStage("verify");
    toast.success(`OTP sent to ${maskPhone(phoneDigits)}`);
  };

  const handleVerifySigninOtp = () => {
    if (!pendingDonor) return;
    if (!verifyOtp(pendingDonor.phone, otpCode)) {
      toast.error("Invalid or expired OTP");
      return;
    }
    setSignedInPhone(pendingDonor.phone);
    setDonor(pendingDonor);
    setMode("profile");
    setOtpStage("idle");
    setOtpCode("");
    setOtpDevHint("");
    setPendingDonor(null);
    toast.success(`Welcome back, ${pendingDonor.fullName}!`);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.gender || !form.department || !form.year || !form.bloodGroup || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    const address = [form.doorNo, form.area, form.city, form.district].filter(Boolean).join(", ");
    const donorData = {
      fullName: form.fullName,
      gender: form.gender,
      department: form.department,
      year: form.year,
      bloodGroup: form.bloodGroup,
      lastDonated:
        form.lastDonated === "pick_date"
          ? form.lastDonatedDate
          : form.lastDonated === "never"
          ? "Never Donated"
          : "",
      address,
      city: form.city,
      phone: phoneDigits,
    };
    try {
      const created = await saveDonor(donorData);
      setSignedInPhone(phoneDigits);
      setDonor(created);
      setMode("profile");
      toast.success("Registration successful! You're now signed in.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      toast.error(msg);
    }
  };

  const handleSignOut = () => {
    clearSignedInPhone();
    setDonor(null);
    setSigninPhone("");
    setMode("signin");
    toast.success("Signed out");
  };

  const handleSaveLastDonated = async () => {
    if (!donor) return;
    if (!newLastDonated) {
      toast.error("Please pick a date");
      return;
    }
    await updateDonorLastDonated(donor.id, newLastDonated);
    setDonor({ ...donor, lastDonated: newLastDonated });
    setEditOpen(false);
    toast.success("Last donation date updated");
  };

  if (loading) {
    return (
      <div className="gradient-soft min-h-[80vh] py-12">
        <div className="container mx-auto max-w-lg px-4 text-center text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  // ===== Profile View =====
  if (mode === "profile" && donor) {
    const daysAgo = (() => {
      if (!donor.lastDonated || donor.lastDonated === "Never Donated") return "";
      const d = new Date(donor.lastDonated);
      if (isNaN(d.getTime())) return "";
      const days = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (days === 0) return "Today";
      if (days === 1) return "1 day ago";
      return `${days} days ago`;
    })();
    const lastDonatedDisplay = donor.lastDonated
      ? donor.lastDonated === "Never Donated"
        ? "Never Donated"
        : `${donor.lastDonated}${daysAgo ? ` (${daysAgo})` : ""}`
      : "—";
    const rows: { label: string; value: string }[] = [
      { label: "Full Name", value: donor.fullName },
      { label: "Gender", value: donor.gender },
      { label: "Department", value: donor.department },
      { label: "Year", value: donor.year },
      { label: "Blood Group", value: donor.bloodGroup },
      { label: "Last Donated", value: lastDonatedDisplay },
      { label: "Address", value: donor.address || "—" },
      { label: "Phone", value: donor.phone },
    ];
    return (
      <div className="gradient-soft min-h-[80vh] py-12">
        <div className="container mx-auto max-w-lg px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">My Profile</h1>
              <p className="mt-2 text-muted-foreground">Your donor details.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign Out
            </Button>
          </div>

          <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {donor.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">{donor.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  Blood Group: <span className="font-medium text-primary">{donor.bloodGroup}</span>
                </p>
              </div>
            </div>

            <dl className="mt-4 divide-y">
              {rows.map((r) => (
                <div key={r.label} className="grid grid-cols-3 gap-2 py-2.5 text-sm">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="col-span-2 font-medium text-foreground">{r.value}</dd>
                </div>
              ))}
            </dl>

            <Button
              className="mt-6 w-full"
              onClick={() => {
                setNewLastDonated(
                  donor.lastDonated && donor.lastDonated !== "Never Donated" ? donor.lastDonated : ""
                );
                setEditOpen(true);
              }}
            >
              <Pencil className="mr-1 h-4 w-4" /> Update Last Donation Date
            </Button>
          </div>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Last Donation Date</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="lastdate">Date</Label>
              <Input
                id="lastdate"
                type="date"
                value={newLastDonated}
                onChange={(e) => setNewLastDonated(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLastDonated}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ===== Sign-In View =====
  if (mode === "signin") {
    return (
      <div className="gradient-soft min-h-[80vh] py-12">
        <div className="container mx-auto max-w-md px-4">
          <h1 className="font-display text-3xl font-bold text-foreground">Sign In</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your registered phone number to access your donor profile.
          </p>

          {otpStage === "verify" && pendingDonor ? (
            <div className="mt-8 space-y-4 rounded-xl border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit verification code to {maskPhone(pendingDonor.phone)}.
              </p>
              {otpDevHint && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Demo mode (no SMS gateway): your code is <strong className="text-foreground">{otpDevHint}</strong>
                </p>
              )}
              <div>
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="mt-1 tracking-widest"
                />
              </div>
              <Button onClick={handleVerifySigninOtp} className="w-full" size="lg">
                Verify & Sign In
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOtpStage("idle");
                  setOtpCode("");
                  setOtpDevHint("");
                  setPendingDonor(null);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
          <form
            onSubmit={handleSignIn}
            className="mt-8 space-y-5 rounded-xl border bg-card p-6 shadow-sm"
          >
            <div>
              <Label htmlFor="signin-phone">Phone Number (10 digits)</Label>
              <Input
                id="signin-phone"
                inputMode="numeric"
                maxLength={10}
                value={signinPhone}
                onChange={(e) => setSigninPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Send OTP
            </Button>

            <div className="flex items-center gap-2 pt-2 text-center text-sm text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                set("phone", signinPhone.replace(/\D/g, "").slice(0, 10));
                setMode("register");
              }}
            >
              <UserPlus className="mr-1 h-4 w-4" /> Register as New Donor
            </Button>
          </form>
          )}
        </div>
      </div>
    );
  }

  // ===== Register View =====
  return (
    <div className="gradient-soft min-h-[80vh] py-12">
      <div className="container mx-auto max-w-lg px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Register as Donor</h1>
            <p className="mt-2 text-muted-foreground">
              Fill in your details to join our donor database.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode("signin")}>
            Back to Sign In
          </Button>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-5 rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="John Doe" className="mt-1" />
          </div>

          <div>
            <Label>Gender *</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={(v) => set("department", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year *</Label>
              <Select value={form.year} onValueChange={(v) => set("year", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Blood Group *</Label>
            <Select value={form.bloodGroup} onValueChange={(v) => set("bloodGroup", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Last Date Blood Donated</Label>
            <Select value={form.lastDonated} onValueChange={(v) => set("lastDonated", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never Donated</SelectItem>
                <SelectItem value="pick_date">Select a Date</SelectItem>
              </SelectContent>
            </Select>
            {form.lastDonated === "pick_date" && (
              <Input type="date" value={form.lastDonatedDate || ""} onChange={(e) => set("lastDonatedDate", e.target.value)} className="mt-2" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Door No.</Label>
              <Input value={form.doorNo} onChange={(e) => set("doorNo", e.target.value)} placeholder="e.g. 12/3" className="mt-1" />
            </div>
            <div>
              <Label>Area</Label>
              <Input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Anna Nagar" className="mt-1" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Chennai" className="mt-1" />
            </div>
            <div>
              <Label>District</Label>
              <Input value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Chennai" className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number * (10 digits)</Label>
            <Input id="phone" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" className="mt-1" />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Register & Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
