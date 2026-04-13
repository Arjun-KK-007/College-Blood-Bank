import { Link } from "react-router-dom";
import { Heart, Users, Droplets, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDonors } from "@/lib/store";

const stats = [
  { label: "Blood Groups", value: "8", icon: Droplets },
  { label: "Active Donors", value: () => String(getDonors().length), icon: Users },
  { label: "Emergency Ready", value: "24/7", icon: Phone },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden px-4 py-24 pb-32 text-center md:py-32 md:pb-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="relative container mx-auto max-w-3xl">
          <div className="mb-6 inline-flex animate-float items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur-sm">
            <Heart className="h-5 w-5 fill-primary-foreground text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">Give the Gift of Life</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
            College Blood Bank
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            A single donation can save up to three lives. Join our campus community of
            life-savers and register as a blood donor today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/request">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-semibold">
                Request Blood
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
                Register as Donor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto mt-8 px-4 pb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground">
                  {typeof s.value === "function" ? s.value() : s.value}
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why donate */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground">Why Donate Blood?</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Blood cannot be manufactured — it can only come from generous donors like you.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { title: "Save Lives", desc: "One donation can help up to 3 patients in need." },
            { title: "Quick & Safe", desc: "The process takes just 10-15 minutes and is completely safe." },
            { title: "Community Impact", desc: "Build a culture of care on campus and inspire others." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-6 text-left">
              <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
