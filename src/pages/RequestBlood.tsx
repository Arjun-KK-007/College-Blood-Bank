import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOOD_GROUPS, saveRequest, getRequests, deleteRequest, isAdmin } from "@/lib/store";
import { Trash2, AlertTriangle } from "lucide-react";

export default function RequestBlood() {
  const [requests, setRequests] = useState(getRequests);
  const admin = isAdmin();
  const [form, setForm] = useState({ requesterName: "", bloodGroup: "", phone: "", urgency: "Normal", hospitalName: "", hospitalLocation: "" });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requesterName || !form.bloodGroup || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    saveRequest(form);
    setRequests(getRequests());
    setForm({ requesterName: "", bloodGroup: "", phone: "", urgency: "Normal", hospitalName: "", hospitalLocation: "" });
    toast.success("Blood request submitted!");
  };

  const handleDelete = (id: string) => {
    deleteRequest(id);
    setRequests(getRequests());
    toast.success("Request removed");
  };

  return (
    <div className="gradient-soft min-h-[80vh] py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Request Blood</h1>
        <p className="mt-2 text-muted-foreground">Need a specific blood group? Submit a request and we'll help connect you.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm h-fit">
            <div><Label>Your Name *</Label><Input value={form.requesterName} onChange={(e) => set("requesterName", e.target.value)} placeholder="Jane Smith" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Blood Group Needed *</Label>
                <Select value={form.bloodGroup} onValueChange={(v) => set("bloodGroup", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Urgency</Label>
                <Select value={form.urgency} onValueChange={(v) => set("urgency", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" className="mt-1" /></div>
            <div><Label>Hospital Name</Label><Input value={form.hospitalName} onChange={(e) => set("hospitalName", e.target.value)} placeholder="City General Hospital" className="mt-1" /></div>
            <div><Label>Hospital Location</Label><Input value={form.hospitalLocation} onChange={(e) => set("hospitalLocation", e.target.value)} placeholder="123 Main Street, City" className="mt-1" /></div>
            <Button type="submit" className="w-full" size="lg">Submit Request</Button>
          </form>

          {/* Active requests */}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Active Requests</h2>
            {requests.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No active requests.</div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">{r.bloodGroup}</span>
                        {r.urgency === "Critical" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        {r.urgency === "Urgent" && <AlertTriangle className="h-4 w-4 text-primary" />}
                        <span className="text-xs text-muted-foreground">{r.urgency}</span>
                      </div>
                      {admin && (
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 font-medium text-foreground">{r.requesterName}</p>
                    <p className="text-sm text-muted-foreground">{r.phone}</p>
                    {r.hospitalName && <p className="mt-1 text-sm text-muted-foreground">🏥 {r.hospitalName}</p>}
                    {r.hospitalLocation && <p className="text-sm text-muted-foreground">📍 {r.hospitalLocation}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
