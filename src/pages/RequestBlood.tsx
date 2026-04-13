import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOOD_GROUPS, saveRequest, getRequests, deleteRequest, isAdmin, getDonors, type Donor } from "@/lib/store";
import { Trash2, AlertTriangle, MessageSquare, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

function buildMessage(request: { requesterName: string; bloodGroup: string; urgency: string; hospitalName: string; hospitalLocation: string; phone: string }): string {
  let msg = `🩸 Urgent Blood Request!\n\nBlood Group Needed: ${request.bloodGroup}\nRequested by: ${request.requesterName}\nUrgency: ${request.urgency}\nContact: ${request.phone}`;
  if (request.hospitalName) msg += `\nHospital: ${request.hospitalName}`;
  if (request.hospitalLocation) msg += `\nLocation: ${request.hospitalLocation}`;
  msg += `\n\nPlease respond if you can donate. Every drop counts! 🙏`;
  return msg;
}

export default function RequestBlood() {
  const [requests, setRequests] = useState(getRequests);
  const admin = isAdmin();
  const [form, setForm] = useState({ requesterName: "", bloodGroup: "", phone: "", urgency: "Normal", hospitalName: "", hospitalLocation: "" });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const [matchingDonors, setMatchingDonors] = useState<{ donors: Donor[]; request: typeof form } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requesterName || !form.bloodGroup || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    saveRequest(form);
    setRequests(getRequests());

    const donors = getDonors().filter(d => d.bloodGroup === form.bloodGroup);
    if (donors.length > 0) {
      setMatchingDonors({ donors, request: { ...form } });
      toast.success(`Blood request submitted! ${donors.length} matching donor(s) found.`);
    } else {
      toast.success("Blood request submitted! No matching donors found currently.");
    }

    setForm({ requesterName: "", bloodGroup: "", phone: "", urgency: "Normal", hospitalName: "", hospitalLocation: "" });
  };

  const handleDelete = (id: string) => {
    deleteRequest(id);
    setRequests(getRequests());
    toast.success("Request removed");
  };

  const sendSMS = (donorPhone: string) => {
    if (!matchingDonors) return;
    const phone = cleanPhone(donorPhone);
    const msg = buildMessage(matchingDonors.request);
    window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendWhatsApp = (donorPhone: string) => {
    if (!matchingDonors) return;
    const phone = cleanPhone(donorPhone);
    const msg = buildMessage(matchingDonors.request);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const notifyAll = (method: "sms" | "whatsapp") => {
    if (!matchingDonors) return;
    const msg = buildMessage(matchingDonors.request);
    const phones = matchingDonors.donors.map(d => cleanPhone(d.phone)).filter(Boolean);
    if (method === "sms") {
      window.open(`sms:${phones.join(",")}?body=${encodeURIComponent(msg)}`, "_blank");
    } else {
      // WhatsApp doesn't support multiple recipients natively, open first one
      if (phones.length > 0) {
        window.open(`https://wa.me/${phones[0]}?text=${encodeURIComponent(msg)}`, "_blank");
        toast.info("WhatsApp supports one contact at a time. Send to others individually.");
      }
    }
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
                {requests.map((r) => {
                  const donors = getDonors().filter(d => d.bloodGroup === r.bloodGroup);
                  return (
                    <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">{r.bloodGroup}</span>
                          {r.urgency === "Critical" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {r.urgency === "Urgent" && <AlertTriangle className="h-4 w-4 text-primary" />}
                          <span className="text-xs text-muted-foreground">{r.urgency}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {donors.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setMatchingDonors({ donors, request: { requesterName: r.requesterName, bloodGroup: r.bloodGroup, phone: r.phone, urgency: r.urgency, hospitalName: r.hospitalName, hospitalLocation: r.hospitalLocation } })}
                            >
                              <Phone className="mr-1 h-3 w-3" /> Notify ({donors.length})
                            </Button>
                          )}
                          {admin && (
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 font-medium text-foreground">{r.requesterName}</p>
                      <p className="text-sm text-muted-foreground">{r.phone}</p>
                      <p className="text-xs text-muted-foreground">📅 Requested: {new Date(r.createdAt).toLocaleDateString("en-GB")}</p>
                      {r.hospitalName && <p className="mt-1 text-sm text-muted-foreground">🏥 {r.hospitalName}</p>}
                      {r.hospitalLocation && <p className="text-sm text-muted-foreground">📍 {r.hospitalLocation}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Matching Donors Dialog */}
      <Dialog open={!!matchingDonors} onOpenChange={() => setMatchingDonors(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Matching Donors ({matchingDonors?.request.bloodGroup})</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Send a message to matching donors via SMS or WhatsApp.</p>

          {matchingDonors && matchingDonors.donors.length > 1 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => notifyAll("sms")}>
                <MessageSquare className="mr-1 h-4 w-4" /> SMS All
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-600 hover:bg-green-50" onClick={() => notifyAll("whatsapp")}>
                <MessageSquare className="mr-1 h-4 w-4" /> WhatsApp All
              </Button>
            </div>
          )}

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {matchingDonors?.donors.map((donor) => (
              <div key={donor.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{donor.fullName}</p>
                  <p className="text-xs text-muted-foreground">{donor.phone}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => sendSMS(donor.phone)} title="Send SMS">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => sendWhatsApp(donor.phone)} title="Send WhatsApp">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
