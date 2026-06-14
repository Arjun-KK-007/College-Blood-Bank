import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Seo from "@/components/Seo";
import { loginAdmin, isAdmin } from "@/lib/store";
import { Shield } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (isAdmin()) {
    navigate("/donors");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginAdmin(username, password);
    if (result.ok) {
      toast.success("Logged in as admin");
      navigate("/donors");
      window.location.reload();
    } else {
      toast.error(result.error || "Invalid credentials");
      setPassword("");
    }
  };

  return (
    <div className="gradient-soft flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-sm px-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Admin Login</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter credentials to manage records</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" /></div>
            <Button type="submit" className="w-full" size="lg">Login</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
