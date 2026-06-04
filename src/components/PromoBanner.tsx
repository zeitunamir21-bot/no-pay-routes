import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "northgo-promo-dismissed";

export function PromoBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold sm:text-sm">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>
          First booking? Use code{" "}
          <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono">WELCOME10</span> for 10% off
        </span>
        <button
          aria-label="Dismiss"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {}
            setShow(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-white/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
