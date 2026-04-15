import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import RequestBlood from "./RequestBlood";

export default function RequestBloodStandalone() {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary fill-primary" />
            <span className="font-display text-xl font-bold text-foreground">
              College <span className="text-primary">Blood Bank</span>
            </span>
          </Link>
          <span className="text-sm text-muted-foreground">Request Blood Portal</span>
        </div>
      </nav>
      <main className="flex-1">
        <RequestBlood />
      </main>
      <footer className="border-t bg-card py-4 text-center text-sm text-muted-foreground">
        Linked with College Blood Bank •{" "}
        <Link to="/" className="text-primary hover:underline">
          Visit Main Site
        </Link>
      </footer>
    </div>
  );
}
