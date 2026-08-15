import type { Metadata } from "next";
import TrackForm from "@/components/TrackForm";
import { getLangDict } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "Track Booking",
  description: "Check the status of your puja booking with your Booking ID and mobile number.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { lang, t } = await getLangDict();
  const { error } = await searchParams;

  const errorMsg =
    error === "payment-failed"
      ? lang === "hi"
        ? "भुगतान पूरा नहीं हुआ। नीचे अपना नंबर डालकर बुकिंग देख सकते हैं, या दोबारा प्रयास करें।"
        : "The payment did not complete. Enter your number below to see the booking, or try again."
      : error
        ? lang === "hi"
          ? "भुगतान की पुष्टि नहीं हो पाई। नीचे अपना नंबर डालकर बुकिंग की स्थिति देखें — पैसा कटा हो तो वह सुरक्षित है।"
          : "We could not confirm the payment. Enter your number below to check the booking — if money was deducted it is safe."
        : "";

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
        {errorMsg && (
          <p className="mx-auto mb-6 max-w-md rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-[14px] leading-relaxed text-amber-900">
            ⚠️ {errorMsg}
          </p>
        )}
        <TrackForm />

        <p className="mx-auto mt-6 max-w-md text-center text-[13px] leading-relaxed text-ink/55">
          {lang === "hi"
            ? "कोई लॉगिन या बुकिंग आईडी याद रखने की ज़रूरत नहीं — बस वही नंबर डालें जो बुकिंग में दिया था। कुछ न मिले तो हमें व्हाट्सएप करें।"
            : "No login or Booking ID needed — just enter the number you used while booking. If nothing shows up, message us on WhatsApp."}
        </p>
      </section>
    </>
  );
}
