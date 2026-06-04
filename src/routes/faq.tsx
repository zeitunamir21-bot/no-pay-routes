import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { FAQ } from "@/components/FAQ";

const URL = "https://no-pay-routes.lovable.app/faq";

const faqEntries = [
  {
    q: "How do I book a seat from Isiolo to Nairobi?",
    a: "Pick an upcoming trip, choose your seat, enter your name and phone, and confirm. Your seat is reserved instantly. Pay on board.",
  },
  {
    q: "How much is a ticket between Isiolo and Nairobi?",
    a: "Standard fare is KES 1,300 per seat, payable on board in cash or via M-Pesa to the driver.",
  },
  {
    q: "Where is the pickup point in Isiolo?",
    a: "Most trips depart from Total Petrol Station, Isiolo. Each trip lists its own pickup point.",
  },
  {
    q: "Can I cancel or change my booking?",
    a: "Yes. Create a free account and visit My Bookings to cancel a confirmed reservation.",
  },
  {
    q: "Are NorthGo drivers verified?",
    a: "Every driver is approved by our admin team. You can view a driver's profile, vehicle, plate number, and passenger reviews before booking.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "NorthGo FAQ — Isiolo ⇄ Nairobi Booking Questions" },
      { name: "description", content: "Answers to common questions about booking, cancelling, fares, pickup points, and driver verification on NorthGo." },
      { property: "og:title", content: "NorthGo FAQ — Isiolo ⇄ Nairobi" },
      { property: "og:description", content: "Common questions about NorthGo Isiolo ⇄ Nairobi seat bookings." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqEntries.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <Header />
      <section className="mx-auto max-w-4xl px-4 pt-14 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Help</span>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">Questions, answered.</h1>
      </section>
      <FAQ />
      <Footer />
      <BottomNav />
    </div>
  );
}
