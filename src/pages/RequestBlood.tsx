import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOOD_GROUPS, saveRequest, getRequests, deleteRequest, markRequestDonated, isAdmin, getDonors, updateRequest, type Donor, type BloodRequest } from "@/lib/store";
import { Trash2, AlertTriangle, MessageSquare, Phone, CheckCircle2, Pencil } from "lucide-react";
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

function getDaysSinceLastDonation(donor: Donor): number | null {
  if (!donor.lastDonated || donor.lastDonated === "Never" || donor.lastDonated === "Never Donated") return null;
  const diff = Date.now() - new Date(donor.lastDonated).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isEligibleDonor(donor: Donor): boolean {
  const days = getDaysSinceLastDonation(donor);
  return days === null || days >= 100;
}

function sortDonorsByEligibility(donors: Donor[]): Donor[] {
  return [...donors].sort((a, b) => {
    const aEligible = isEligibleDonor(a);
    const bEligible = isEligibleDonor(b);
    if (aEligible && !bEligible) return -1;
    if (!aEligible && bEligible) return 1;
    // Never donated first among eligible
    const aDays = getDaysSinceLastDonation(a);
    const bDays = getDaysSinceLastDonation(b);
    if (aDays === null && bDays !== null) return -1;
    if (aDays !== null && bDays === null) return 1;
    if (aDays !== null && bDays !== null) return bDays - aDays; // longest ago first
    return 0;
  });
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function RequestBlood() {
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getRequests>>>([]);
  const [allDonors, setAllDonors] = useState<Donor[]>([]);
  const admin = isAdmin();
  const [form, setForm] = useState({ requesterName: "", bloodGroup: "", phone: "", urgency: "Normal", hospitalName: "", hospitalLocation: "" });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const [matchingDonors, setMatchingDonors] = useState<{ donors: Donor[]; request: typeof form } | null>(null);
  const [donatingId, setDonatingId] = useState<string | null>(null);
  const [donatedDate, setDonatedDate] = useState("");
  const [editReq, setEditReq] = useState<BloodRequest | null>(null);
  const [editForm, setEditForm] = useState({ requesterName: "", bloodGroup: "", phone: "", urgency: "Normal", hospitalName: "", hospitalLocation: "" });

  const refresh = async () => {
    try {
      const [r, d] = await Promise.all([getRequests(), getDonors()]);
      setRequests(r);
      setAllDonors(d);
    } catch {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const getDaysUntilEligible = (donor: Donor): number => {
    const days = getDaysSinceLastDonation(donor);
    if (days === null) return 0;
    return Math.max(0, 100 - days);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requesterName || !form.bloodGroup || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    try {
      const payload = { ...form, phone: phoneDigits };
      await saveRequest(payload);
      await refresh();

      const donors = allDonors.filter(d => d.bloodGroup === form.bloodGroup);
      const sortedDonors = sortDonorsByEligibility(donors);
      const eligibleDonors = sortedDonors.filter(isEligibleDonor);

      if (eligibleDonors.length > 0) {
        setMatchingDonors({ donors: sortedDonors, request: payload });
        toast.success(`Blood request submitted! ${eligibleDonors.length} eligible donor(s) found. You can notify them manually.`);
      } else if (donors.length > 0) {
        setMatchingDonors({ donors: sortedDonors, request: payload });
        toast.success("Blood request submitted! Matching donors found but none eligible (donated recently).");
      } else {
        toast.success("Blood request submitted! No matching donors found currently.");
      }

      setForm({ requesterName: "", bloodGroup: "", phone: "", urgency: "Normal", hospitalName: "", hospitalLocation: "" });
    } catch {
      toast.error("Failed to submit request");
    }
  };

  const openEdit = (r: BloodRequest) => {
    if (!admin) {
      const entered = window.prompt("Enter the phone number used for this request to edit it:");
      if (entered === null) return;
      const normalized = entered.replace(/\D/g, "");
      if (normalized !== (r.phone || "").replace(/\D/g, "")) {
        toast.error("Phone number does not match. Only the requester can edit.");
        return;
      }
    }
    setEditReq(r);
    setEditForm({ requesterName: r.requesterName, bloodGroup: r.bloodGroup, phone: r.phone, urgency: r.urgency || "Normal", hospitalName: r.hospitalName || "", hospitalLocation: r.hospitalLocation || "" });
  };

  const handleSaveEdit = async () => {
    if (!editReq) return;
    const phoneDigits = editForm.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    try {
      await updateRequest(editReq.id, { ...editForm, phone: phoneDigits });
      await refresh();
      setEditReq(null);
      toast.success("Request updated");
    } catch {
      toast.error("Failed to update request");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRequest(id);
    await refresh();
    toast.success("Request removed");
  };

  const handleMarkDonated = async (id: string) => {
    if (!donatedDate) {
      toast.error("Please select a donated date");
      return;
    }
    await markRequestDonated(id, donatedDate);
    await refresh();
    setDonatingId(null);
    setDonatedDate("");
    toast.success("Marked as blood donated!");
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
    const eligible = matchingDonors.donors.filter(isEligibleDonor);
    const phones = eligible.map(d => cleanPhone(d.phone)).filter(Boolean);
    if (method === "sms") {
      window.open(`sms:${phones.join(",")}?body=${encodeURIComponent(msg)}`, "_blank");
    } else {
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
            <div><Label>Phone * (10 digits)</Label><Input inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" className="mt-1" /></div>
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
                  const donors = sortDonorsByEligibility(allDonors.filter(d => d.bloodGroup === r.bloodGroup));
                  const eligibleCount = donors.filter(isEligibleDonor).length;
                  return (
                    <div key={r.id} className={`rounded-xl border bg-card p-4 shadow-sm transition-opacity ${r.donated ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">{r.bloodGroup}</span>
                          {r.urgency === "Critical" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {r.urgency === "Urgent" && <AlertTriangle className="h-4 w-4 text-primary" />}
                          <span className="text-xs text-muted-foreground">{r.urgency}</span>
                          {r.donated && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"><CheckCircle2 className="h-3 w-3" /> Donated</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {!r.donated && donors.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setMatchingDonors({ donors, request: { requesterName: r.requesterName, bloodGroup: r.bloodGroup, phone: r.phone, urgency: r.urgency, hospitalName: r.hospitalName, hospitalLocation: r.hospitalLocation } })}
                            >
                              <Phone className="mr-1 h-3 w-3" /> Notify ({eligibleCount}/{donors.length})
                            </Button>
                          )}
                          {!r.donated && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-primary border-primary/30 hover:bg-primary/10"
                              onClick={() => { setDonatingId(r.id); setDonatedDate(new Date().toISOString().split("T")[0]); }}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Donated
                            </Button>
                          )}
                          {admin && (
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {donatingId === r.id && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                          <Label className="text-xs whitespace-nowrap">Donated Date:</Label>
                          <Input type="date" value={donatedDate} onChange={(e) => setDonatedDate(e.target.value)} className="h-8 text-xs w-auto" />
                          <Button size="sm" className="h-8 text-xs" onClick={() => handleMarkDonated(r.id)}>Confirm</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setDonatingId(null); setDonatedDate(""); }}>Cancel</Button>
                        </div>
                      )}
                      <p className="mt-2 font-medium text-foreground">{r.requesterName}</p>
                      <p className="text-sm text-muted-foreground">{r.phone}</p>
                      <p className="text-xs text-muted-foreground">📅 Requested: {new Date(r.createdAt).toLocaleDateString("en-GB")}</p>
                      {r.hospitalName && <p className="mt-1 text-sm text-muted-foreground">🏥 {r.hospitalName}</p>}
                      {r.hospitalLocation && <p className="text-sm text-muted-foreground">📍 {r.hospitalLocation}</p>}
                      {r.donated && r.donatedDate && <p className="mt-1 text-xs text-primary font-medium">✅ Blood donated on {new Date(r.donatedDate).toLocaleDateString("en-GB")}</p>}
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
          <p className="text-sm text-muted-foreground">Eligible donors (100+ days or never donated) are listed first. Notifications sent automatically via SMS & WhatsApp.</p>

          {matchingDonors && matchingDonors.donors.filter(isEligibleDonor).length > 1 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => notifyAll("sms")}>
                <MessageSquare className="mr-1 h-4 w-4" /> SMS All Eligible
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-600 hover:bg-green-50" onClick={() => notifyAll("whatsapp")}>
                <WhatsAppIcon className="mr-1 h-4 w-4" /> WhatsApp All
              </Button>
            </div>
          )}

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {matchingDonors?.donors.map((donor) => {
              const days = getDaysSinceLastDonation(donor);
              const eligible = isEligibleDonor(donor);
              const daysUntil = getDaysUntilEligible(donor);
              return (
                <div key={donor.id} className={`flex items-center justify-between rounded-lg border p-3 ${!eligible ? 'opacity-60' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-foreground">{donor.fullName}</p>
                    <p className="text-xs text-muted-foreground">{donor.gender} • {donor.phone}</p>
                    {donor.address && <p className="text-xs text-muted-foreground">📍 {donor.address}</p>}
                    <p className="text-xs text-muted-foreground">
                      {eligible ? "✅ Can donate" : `❌ Can donate after ${daysUntil} days`}
                    </p>
                  </div>
                  {eligible && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => sendSMS(donor.phone)} title="Send SMS">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => sendWhatsApp(donor.phone)} title="Send WhatsApp">
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
