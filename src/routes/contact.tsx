import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { ContactSupport } from "@/components/ContactSupport";

const URL = "https://no-pay-routes.lovable.app/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact NorthGo — WhatsApp, Phone & Email Support" },
      { name: "description", content: "Reach NorthGo support 7 days a week on WhatsApp or by phone for Isiolo ⇄ Nairobi booking help." },
      { property: "og:title", content: "Contact NorthGo Support" },
      { property: "og:description", content: "WhatsApp, call, or email NorthGo for booking help on the Isiolo ⇄ Nairobi route." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <Header />
      <section className="mx-auto max-w-4xl px-4 py-14 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Support</span>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">Talk to a real person.</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Our team is on WhatsApp 7 days a week. We respond within minutes during operating hours
          (6 AM – 10 PM EAT).
        </p>
      </section>
      <ContactSupport />
      <Footer />
      <BottomNav />
    </div>
  );
}
