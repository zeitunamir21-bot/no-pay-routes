import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";

type Promo = {
  id: string;
  code: string;
  description: string | null;
  discount_pct: number | null;
  discount_amount: number | null;
  max_uses: number | null;
  uses: number;
  valid_until: string | null;
  active: boolean;
};

export function PromoCodesAdmin() {
  const [open, setOpen] = useState(false);

  const { data: codes = [], refetch } = useQuery({
    queryKey: ["admin", "promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Promo[];
    },
  });

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Promo codes</h2>
        <Button onClick={() => setOpen((o) => !o)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> {open ? "Cancel" : "Add code"}
        </Button>
      </div>

      {open && <PromoForm onDone={() => { setOpen(false); refetch(); }} />}

      <div className="mt-4 space-y-3">
        {codes.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No promo codes yet.
          </div>
        )}
        {codes.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <div className="font-mono text-base font-bold">{p.code}</div>
                <div className="text-xs text-muted-foreground">
                  {p.discount_pct ? `${p.discount_pct}% off` : `KES ${p.discount_amount} off`}
                  {p.description && ` · ${p.description}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {p.uses}{p.max_uses ? `/${p.max_uses}` : ""} used
              </Badge>
              <Badge variant={p.active ? "default" : "outline"}>
                {p.active ? "Active" : "Off"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const { error } = await supabase
                    .from("promo_codes")
                    .update({ active: !p.active })
                    .eq("id", p.id);
                  if (error) toast.error(error.message);
                  else refetch();
                }}
              >
                {p.active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={async () => {
                  if (!confirm(`Delete code ${p.code}?`)) return;
                  const { error } = await supabase.from("promo_codes").delete().eq("id", p.id);
                  if (error) toast.error(error.message);
                  else refetch();
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromoForm({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "pct" as "pct" | "amt",
    value: 10,
    max_uses: "" as string | number,
    valid_until: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || form.value <= 0) {
      toast.error("Enter a code and a positive value");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("promo_codes").insert({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_pct: form.type === "pct" ? form.value : null,
      discount_amount: form.type === "amt" ? form.value : null,
      max_uses: form.max_uses === "" ? null : Number(form.max_uses),
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      active: true,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Promo code created");
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
      <div>
        <Label className="mb-1.5 block text-xs">Code</Label>
        <Input
          required
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="WELCOME10"
          className="font-mono uppercase"
        />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Description</Label>
        <Input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="First-time discount"
        />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Discount type</Label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as "pct" | "amt" })}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="pct">Percentage (%)</option>
          <option value="amt">Fixed amount (KES)</option>
        </select>
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Value</Label>
        <Input
          required
          type="number"
          min={1}
          max={form.type === "pct" ? 100 : 100000}
          value={form.value}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Max uses (optional)</Label>
        <Input
          type="number"
          min={1}
          value={form.max_uses}
          onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
          placeholder="Unlimited"
        />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Expiry (optional)</Label>
        <Input
          type="datetime-local"
          value={form.valid_until}
          onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create code
        </Button>
      </div>
    </form>
  );
}
