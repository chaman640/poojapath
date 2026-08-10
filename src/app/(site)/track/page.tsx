import type { Metadata } from "next";
import TrackForm from "@/components/TrackForm";
import { getLangDict } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "Track Booking",
  description: "Check the status of your puja booking with your Booking ID and mobile number.",
};

export default async function TrackPage() {
  const { lang, t } = await getLangDict();

  return (
    <>
      <section className="bg-temple-gradient py-12 text-center text-saffron-50 sm:py-16">
        <div className="container-x">
          <h1 className="font-display text-3xl text-gold-100 sm:text-4xl">{t.track.title}</h1>
          <div className="divider-gold mt-4" />
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-saffron-100/80">
            {t.track.subtitle}
          </p>
        </div>
      </section>

      <section className="container-x py-12">
        <TrackForm />

        <p className="mx-auto mt-6 max-w-md text-center text-[13px] leading-relaxed text-ink/55">
          {lang === "hi"
            ? "बुकिंग आईडी आपको बुकिंग के तुरंत बाद स्क्रीन पर और व्हाट्सएप पर मिली थी। न मिले तो हमें व्हाट्सएप करें।"
            : "Your Booking ID was shown right after booking and sent on WhatsApp. If you can't find it, message us on WhatsApp."}
        </p>
      </section>
    </>
  );
}
