import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-card py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Heart className="h-4 w-4 text-primary fill-primary" />
          <span className="text-sm">College Blood Bank &copy; {new Date().getFullYear()}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Every drop counts. Donate blood, save lives.
        </p>
      </div>
    </footer>
  );
}
