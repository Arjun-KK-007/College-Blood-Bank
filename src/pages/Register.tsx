import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS, BLOOD_GROUPS, YEARS, GENDERS, saveDonor } from "@/lib/store";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    department: "",
    year: "",
    bloodGroup: "",
    lastDonated: "",
    address: "",
    phone: "",
  });

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.gender || !form.department || !form.year || !form.bloodGroup || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    saveDonor(form);
    toast.success("Registration successful! Thank you for becoming a donor.");
    navigate("/donors");
  };

  return (
    <div className="gradient-soft min-h-[80vh] py-12">
      <div className="container mx-auto max-w-lg px-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Register as Donor</h1>
        <p className="mt-2 text-muted-foreground">Fill in your details to join our donor database.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border bg-card p-6 shadow-sm">
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

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Hostel / Home address" className="mt-1" rows={3} />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" className="mt-1" />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Register
          </Button>
        </form>
      </div>
    </div>
  );
}
