import { Phone, Mail, MapPin, Clock } from "lucide-react";

const contacts = [
  { icon: Phone, label: "Emergency Helpline", value: "+91 98765 43210", sub: "Available 24/7" },
  { icon: Mail, label: "Email", value: "bloodbank@college.edu", sub: "Response within 24 hours" },
  { icon: MapPin, label: "Location", value: "Health Center, Main Campus", sub: "Ground Floor, Room 101" },
  { icon: Clock, label: "Operating Hours", value: "Mon–Sat: 9 AM – 5 PM", sub: "Emergency available 24/7" },
];

export default function Contact() {
  return (
    <div className="gradient-soft min-h-[80vh] py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">Reach out to us for blood donation inquiries, emergencies, or any questions.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {contacts.map((c) => (
            <div key={c.label} className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="font-medium text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="font-display text-lg font-semibold text-destructive">🚨 Emergency Contacts</h2>
          <p className="mt-2 text-sm text-foreground">
            In case of a blood emergency, call our 24/7 helpline at{" "}
            <strong>+91 98765 43210</strong> or visit the Health Center immediately.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nearest hospital: City General Hospital — <strong>+91 11234 56789</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
