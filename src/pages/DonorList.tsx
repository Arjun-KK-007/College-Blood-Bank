import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CalendarDays } from "lucide-react";
import { getDonors, deleteDonor, updateDonor, isAdmin, BLOOD_GROUPS, DEPARTMENTS, YEARS, GENDERS, type Donor } from "@/lib/store";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === "Never Donated") return "Never Donated";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function getDaysAgo(dateStr: string): string {
  if (!dateStr || dateStr === "Never Donated") return "Never Donated";
  const donated = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - donated.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function getCityFromAddress(address: string): string {
  if (!address) return "";
  const parts = address.split(",").map(p => p.trim());
  return parts[2] || "";
}

function getDistrictFromAddress(address: string): string {
  if (!address) return "";
  const parts = address.split(",").map(p => p.trim());
  return parts[3] || "";
}

export default function DonorList() {
  const [donors, setDonors] = useState(getDonors);
  const [filterBG, setFilterBG] = useState("all");
  const [sortCity, setSortCity] = useState("all");
  const admin = isAdmin();
  const [editDonor, setEditDonor] = useState<Donor | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", gender: "", department: "", year: "", bloodGroup: "", lastDonated: "", doorNo: "", area: "", city: "", district: "", phone: "" });
  const [updateDateDonor, setUpdateDateDonor] = useState<Donor | null>(null);
  const [newLastDonated, setNewLastDonated] = useState("");

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    donors.forEach((d) => {
      const city = getCityFromAddress(d.address);
      if (city) citySet.add(city);
    });
    return Array.from(citySet).sort();
  }, [donors]);

  const filtered = useMemo(() => {
    return donors.filter((d) => {
      const matchBG = filterBG === "all" || d.bloodGroup === filterBG;
      const matchCity = sortCity === "all" || getCityFromAddress(d.address).toLowerCase() === sortCity.toLowerCase();
      return matchBG && matchCity;
    });
  }, [donors, filterBG, sortCity]);

  const handleDelete = (id: string) => {
    deleteDonor(id);
    setDonors(getDonors());
    toast.success("Donor record deleted");
  };

  const openEdit = (d: Donor) => {
    setEditDonor(d);
    const parts = (d.address || "").split(",").map(p => p.trim());
    setEditForm({ fullName: d.fullName, gender: d.gender || "", department: d.department, year: d.year, bloodGroup: d.bloodGroup, lastDonated: d.lastDonated || "", doorNo: parts[0] || "", area: parts[1] || "", city: parts[2] || "", district: parts[3] || "", phone: d.phone });
  };

  const handleEdit = () => {
    if (!editDonor) return;
    const address = [editForm.doorNo, editForm.area, editForm.city, editForm.district].filter(Boolean).join(", ");
    updateDonor(editDonor.id, { fullName: editForm.fullName, gender: editForm.gender, department: editForm.department, year: editForm.year, bloodGroup: editForm.bloodGroup, lastDonated: editForm.lastDonated, address, phone: editForm.phone });
    setDonors(getDonors());
    setEditDonor(null);
    toast.success("Donor record updated");
  };

  const openUpdateDate = (d: Donor) => {
    setUpdateDateDonor(d);
    setNewLastDonated(d.lastDonated && d.lastDonated !== "Never Donated" ? d.lastDonated : "");
  };

  const handleUpdateDate = () => {
    if (!updateDateDonor || !newLastDonated) return;
    updateDonor(updateDateDonor.id, { ...updateDateDonor, lastDonated: newLastDonated });
    setDonors(getDonors());
    setUpdateDateDonor(null);
    toast.success("Last donation date updated");
  };

  return (
    <div className="gradient-soft min-h-[80vh] py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Donor List</h1>
        <p className="mt-2 text-muted-foreground">Browse registered blood donors.</p>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={filterBG} onValueChange={setFilterBG}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortCity} onValueChange={setSortCity}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead className="hidden md:table-cell">Last Donated</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    No donors found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => {
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.fullName}</TableCell>
                      <TableCell>{d.gender || "—"}</TableCell>
                      <TableCell>{d.department}</TableCell>
                      <TableCell>{d.year}</TableCell>
                      <TableCell>
                        <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                          {d.bloodGroup}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <span>{formatDate(d.lastDonated) || "—"}</span>
                          {d.lastDonated && d.lastDonated !== "Never Donated" && (
                            <span className="ml-1 text-xs text-muted-foreground">({getDaysAgo(d.lastDonated)})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">{d.address || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.phone}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openUpdateDate(d)} title="Update last donation date">
                            <CalendarDays className="h-4 w-4" />
                          </Button>
                          {admin && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => openEdit(d)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Update Last Donated Dialog (for any donor) */}
      <Dialog open={!!updateDateDonor} onOpenChange={() => setUpdateDateDonor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Last Donation Date</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Update the last blood donation date for <strong>{updateDateDonor?.fullName}</strong>.</p>
            <div>
              <Label>Last Date Blood Donated</Label>
              <Input type="date" value={newLastDonated} onChange={(e) => setNewLastDonated(e.target.value)} className="mt-1" />
            </div>
            {newLastDonated && (
              <p className="text-sm text-muted-foreground">That was <strong>{getDaysAgo(newLastDonated)}</strong>.</p>
            )}
            <Button onClick={handleUpdateDate} className="w-full" disabled={!newLastDonated}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (admin only) */}
      <Dialog open={!!editDonor} onOpenChange={() => setEditDonor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Donor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input value={editForm.fullName} onChange={(e) => setEditForm(p => ({ ...p, fullName: e.target.value }))} className="mt-1" /></div>
            <div><Label>Gender</Label>
              <Select value={editForm.gender} onValueChange={(v) => setEditForm(p => ({ ...p, gender: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Department</Label>
                <Select value={editForm.department} onValueChange={(v) => setEditForm(p => ({ ...p, department: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Year</Label>
                <Select value={editForm.year} onValueChange={(v) => setEditForm(p => ({ ...p, year: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Blood Group</Label>
              <Select value={editForm.bloodGroup} onValueChange={(v) => setEditForm(p => ({ ...p, bloodGroup: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Last Date Blood Donated</Label><Input type="date" value={editForm.lastDonated} onChange={(e) => setEditForm(p => ({ ...p, lastDonated: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Door No.</Label><Input value={editForm.doorNo} onChange={(e) => setEditForm(p => ({ ...p, doorNo: e.target.value }))} className="mt-1" placeholder="Door No." /></div>
              <div><Label>Area</Label><Input value={editForm.area} onChange={(e) => setEditForm(p => ({ ...p, area: e.target.value }))} className="mt-1" placeholder="Area" /></div>
              <div><Label>City</Label><Input value={editForm.city} onChange={(e) => setEditForm(p => ({ ...p, city: e.target.value }))} className="mt-1" placeholder="City" /></div>
              <div><Label>District</Label><Input value={editForm.district} onChange={(e) => setEditForm(p => ({ ...p, district: e.target.value }))} className="mt-1" placeholder="District" /></div>
            </div>
            <div><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
            <Button onClick={handleEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
