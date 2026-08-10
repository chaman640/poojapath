import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLangDict } from "@/lib/lang-server";
import { siteConfig } from "@/lib/env";

const DOCS = ["privacy", "terms", "refund", "shipping"] as const;
type Doc = (typeof DOCS)[number];

type Params = Promise<{ doc: string }>;

const TITLES: Record<Doc, { en: string; hi: string }> = {
  privacy: { en: "Privacy Policy", hi: "गोपनीयता नीति" },
  terms: { en: "Terms & Conditions", hi: "नियम एवं शर्तें" },
  refund: { en: "Refund & Cancellation Policy", hi: "रिफंड एवं रद्दीकरण नीति" },
  shipping: { en: "Shipping & Delivery Policy", hi: "शिपिंग एवं डिलीवरी नीति" },
};

export async function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { doc } = await params;
  if (!DOCS.includes(doc as Doc)) return { title: "Not found" };
  return { title: TITLES[doc as Doc].en };
}

function Section({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <>
      <h2>{h}</h2>
      {children}
    </>
  );
}

export default async function LegalPage({ params }: { params: Params }) {
  const { doc } = await params;
  if (!DOCS.includes(doc as Doc)) notFound();
  const key = doc as Doc;

  const { lang } = await getLangDict();
  const hi = lang === "hi";
  const title = hi ? TITLES[key].hi : TITLES[key].en;
  const brand = siteConfig.name;

  return (
    <>
      <section className="bg-temple-gradient py-10 text-center text-saffron-50 sm:py-14">
        <div className="container-x">
          <h1 className="font-display text-3xl text-gold-100">{title}</h1>
          <div className="divider-gold mt-4" />
        </div>
      </section>

      <article className="container-x prose-devotional max-w-3xl py-12">
        <p className="text-[13px] text-ink/50">
          {hi ? "अंतिम अद्यतन" : "Last updated"}: {new Date().toLocaleDateString(hi ? "hi-IN" : "en-IN", { month: "long", year: "numeric" })}
        </p>

        {/* ------------------------------- PRIVACY ------------------------------- */}
        {key === "privacy" && (
          <>
            <p>
              {hi
                ? `${brand} ("हम") आपकी निजता का सम्मान करता है। यह नीति बताती है कि हम कौन-सी जानकारी लेते हैं, क्यों लेते हैं, और उसे कैसे सुरक्षित रखते हैं।`
                : `${brand} ("we") respects your privacy. This policy explains what information we collect, why we collect it, and how we protect it.`}
            </p>

            <Section h={hi ? "1. हम क्या जानकारी लेते हैं" : "1. Information we collect"}>
              <ul>
                <li>{hi ? "नाम, गोत्र और मोबाइल नंबर — पूजा संकल्प एवं अपडेट के लिए" : "Name, gotra and mobile number — for the puja sankalp and updates"}</li>
                <li>{hi ? "ईमेल (वैकल्पिक) — रसीद एवं सूचना के लिए" : "Email (optional) — for receipts and notifications"}</li>
                <li>{hi ? "डाक पता (वैकल्पिक) — केवल प्रसाद भेजने के लिए" : "Postal address (optional) — only to courier your prasad"}</li>
                <li>{hi ? "तकनीकी लॉग — दुरुपयोग रोकने हेतु IP का हैश (सादा IP नहीं)" : "Technical logs — a hash of your IP (never the raw IP) to prevent abuse"}</li>
              </ul>
              <p>
                {hi
                  ? "हम आपके कार्ड, UPI अथवा बैंक विवरण न देखते हैं न संग्रहित करते हैं। भुगतान पूरी तरह रेज़रपे के सुरक्षित सर्वर पर होता है।"
                  : "We never see or store your card, UPI or bank details. Payments are processed entirely on Razorpay's secure servers."}
              </p>
            </Section>

            <Section h={hi ? "2. हम इसका उपयोग कैसे करते हैं" : "2. How we use it"}>
              <p>
                {hi
                  ? "आपकी जानकारी केवल तीन कामों में उपयोग होती है — (क) पूजा के संकल्प में आपका नाम व गोत्र लेना, (ख) व्हाट्सएप/ईमेल पर बुकिंग अपडेट, वीडियो एवं ट्रैकिंग भेजना, (ग) प्रसाद कूरियर करना। इससे बाहर कोई उपयोग नहीं।"
                  : "Your information is used for exactly three things — (a) taking your name and gotra in the puja sankalp, (b) sending booking updates, the video and tracking on WhatsApp/email, and (c) couriering your prasad. Nothing beyond this."}
              </p>
            </Section>

            <Section h={hi ? "3. साझाकरण" : "3. Sharing"}>
              <p>
                {hi
                  ? "हम आपकी जानकारी कभी नहीं बेचते। यह केवल इन तक जाती है: संबंधित मंदिर के पंडित जी (नाम व गोत्र), भुगतान गेटवे (रेज़रपे), व्हाट्सएप संदेश प्रदाता, और कूरियर कंपनी (केवल पता)। कानूनी रूप से आवश्यक होने पर सक्षम अधिकारी को।"
                  : "We never sell your data. It reaches only: the pandit at the relevant temple (name and gotra), the payment gateway (Razorpay), our WhatsApp message provider, and the courier company (address only). Also to a competent authority where legally required."}
              </p>
            </Section>

            <Section h={hi ? "4. सुरक्षा" : "4. Security"}>
              <p>
                {hi
                  ? "पूरी साइट HTTPS पर चलती है। एडमिन पासवर्ड bcrypt से हैश होते हैं। डेटाबेस क्वेरी पैरामीटराइज़्ड हैं (SQL injection से सुरक्षित)। भुगतान की पुष्टि सर्वर-टू-सर्वर हस्ताक्षर सत्यापन से होती है।"
                  : "The entire site runs over HTTPS. Admin passwords are hashed with bcrypt. Database queries are parameterised (protected against SQL injection). Payments are confirmed with server-to-server signature verification."}
              </p>
            </Section>

            <Section h={hi ? "5. आपके अधिकार" : "5. Your rights"}>
              <p>
                {hi
                  ? `आप कभी भी अपनी जानकारी देखने, सुधारने अथवा हटाने का अनुरोध कर सकते हैं — ${siteConfig.email} पर लिखें। बुकिंग पूरी हो जाने के बाद हम रिकॉर्ड केवल लेखा एवं कानूनी आवश्यकता तक रखते हैं।`
                  : `You may ask to view, correct or delete your information at any time — write to ${siteConfig.email}. After a booking is complete we retain records only as long as accounting and legal requirements demand.`}
              </p>
            </Section>
          </>
        )}

        {/* -------------------------------- TERMS -------------------------------- */}
        {key === "terms" && (
          <>
            <Section h={hi ? "1. सेवा की प्रकृति" : "1. Nature of the service"}>
              <p>
                {hi
                  ? `${brand} एक माध्यम है जो भक्तों को मंदिरों एवं तीर्थ क्षेत्रों के पंडितों से जोड़ता है। पूजा शास्त्रोक्त विधि से संपन्न कराई जाती है। पूजा एक श्रद्धा एवं आस्था का विषय है — किसी विशिष्ट सांसारिक परिणाम की गारंटी नहीं दी जा सकती और न ही दी जाती है।`
                  : `${brand} is a facilitator that connects devotees with pandits at temples and tirth kshetras. The puja is performed according to shastra vidhi. A puja is a matter of shraddha and faith — no specific worldly outcome is or can be guaranteed.`}
              </p>
            </Section>

            <Section h={hi ? "2. बुकिंग" : "2. Bookings"}>
              <ul>
                <li>{hi ? "बुकिंग तभी मान्य है जब भुगतान सफल हो और आपको बुकिंग आईडी मिल जाए।" : "A booking is valid only once payment succeeds and you receive a Booking ID."}</li>
                <li>{hi ? "नाम एवं गोत्र आपकी ज़िम्मेदारी है — गलत जानकारी पर पूजा दोबारा नहीं होगी।" : "The name and gotra you provide are your responsibility — a puja will not be repeated for incorrect details."}</li>
                <li>{hi ? "पूजा तिथि मुहूर्त, मंदिर की व्यवस्था अथवा अप्रत्याशित कारणों से बदल सकती है; ऐसी स्थिति में आपको सूचित किया जाएगा।" : "The puja date may shift due to muhurt, temple arrangements or unforeseen reasons; you will be informed if this happens."}</li>
              </ul>
            </Section>

            <Section h={hi ? "3. आयु एवं उपयोग" : "3. Age and use"}>
              <p>
                {hi
                  ? "यह सेवा 18 वर्ष या उससे अधिक आयु के व्यक्तियों के लिए है। साइट का उपयोग किसी अवैध कार्य, स्वचालित स्क्रैपिंग अथवा सुरक्षा भंग करने के प्रयास हेतु नहीं किया जा सकता।"
                  : "This service is for persons aged 18 or above. The site may not be used for any unlawful purpose, automated scraping, or any attempt to breach its security."}
              </p>
            </Section>

            <Section h={hi ? "4. दायित्व की सीमा" : "4. Limitation of liability"}>
              <p>
                {hi
                  ? "किसी भी परिस्थिति में हमारा अधिकतम दायित्व आपके द्वारा उस बुकिंग हेतु दी गई राशि तक सीमित रहेगा।"
                  : "In all circumstances our maximum liability is limited to the amount you paid for the booking in question."}
              </p>
            </Section>

            <Section h={hi ? "5. विवाद एवं अधिकार क्षेत्र" : "5. Disputes and jurisdiction"}>
              <p>
                {hi
                  ? "इन शर्तों पर भारतीय कानून लागू होगा और विवाद हमारे पंजीकृत कार्यालय के स्थानीय न्यायालयों के अधिकार क्षेत्र में आएँगे।"
                  : "These terms are governed by the laws of India and disputes fall under the jurisdiction of the courts local to our registered office."}
              </p>
            </Section>
          </>
        )}

        {/* -------------------------------- REFUND ------------------------------- */}
        {key === "refund" && (
          <>
            <Section h={hi ? "1. रद्दीकरण" : "1. Cancellation"}>
              <ul>
                <li>{hi ? "पूजा तिथि से 24 घंटे पहले तक: पूर्ण रिफंड।" : "More than 24 hours before the puja date: full refund."}</li>
                <li>{hi ? "24 घंटे के भीतर: रद्दीकरण संभव नहीं, क्योंकि सामग्री क्रय हो चुकी होती है और पंडित जी नियुक्त हो चुके होते हैं।" : "Within 24 hours: cancellation is not possible, as samagri has been purchased and the pandit allocated."}</li>
                <li>{hi ? "पूजा संपन्न हो जाने के बाद किसी भी स्थिति में रिफंड नहीं।" : "No refund is available once the puja has been performed."}</li>
              </ul>
            </Section>

            <Section h={hi ? "2. हमारी ओर से रद्द होने पर" : "2. If we cancel"}>
              <p>
                {hi
                  ? "यदि किसी कारणवश पूजा हमारी ओर से संपन्न न हो सके, तो आपको पूरी राशि लौटा दी जाएगी अथवा आपकी सहमति से किसी अन्य तिथि/पूजा में स्थानांतरित कर दिया जाएगा।"
                  : "If for any reason we are unable to perform the puja, you will receive a full refund, or with your consent the booking will be moved to another date or puja."}
              </p>
            </Section>

            <Section h={hi ? "3. रिफंड में लगने वाला समय" : "3. Refund timelines"}>
              <p>
                {hi
                  ? "स्वीकृत रिफंड 5-7 कार्य दिवसों में उसी माध्यम से वापस किया जाता है जिससे भुगतान हुआ था। बैंक के अनुसार 2-3 दिन अतिरिक्त लग सकते हैं।"
                  : "Approved refunds are returned to the original payment method within 5-7 working days. Your bank may take 2-3 additional days."}
              </p>
            </Section>

            <Section h={hi ? "4. रिफंड कैसे माँगें" : "4. How to request a refund"}>
              <p>
                {hi
                  ? `अपनी बुकिंग आईडी के साथ ${siteConfig.whatsapp} पर व्हाट्सएप करें अथवा ${siteConfig.email} पर ईमेल करें।`
                  : `WhatsApp us at ${siteConfig.whatsapp} or email ${siteConfig.email} with your Booking ID.`}
              </p>
            </Section>
          </>
        )}

        {/* ------------------------------- SHIPPING ------------------------------ */}
        {key === "shipping" && (
          <>
            <Section h={hi ? "1. डिजिटल डिलीवरी" : "1. Digital delivery"}>
              <p>
                {hi
                  ? "पूजा का वीडियो एवं संपन्नता प्रमाण-पत्र पूजा के 24 से 48 घंटे के भीतर आपके व्हाट्सएप नंबर पर भेजा जाता है। इसका कोई अतिरिक्त शुल्क नहीं है।"
                  : "The puja video and completion certificate are sent to your WhatsApp number within 24 to 48 hours of the puja. There is no additional charge for this."}
              </p>
            </Section>

            <Section h={hi ? "2. प्रसाद डिलीवरी" : "2. Prasad delivery"}>
              <ul>
                <li>{hi ? "भारत में कहीं भी 7-10 कार्य दिवसों में — निःशुल्क।" : "Anywhere in India within 7-10 working days — free of charge."}</li>
                <li>{hi ? "दूरस्थ क्षेत्रों में 3-5 दिन अतिरिक्त लग सकते हैं।" : "Remote locations may take 3-5 additional days."}</li>
                <li>{hi ? "प्रेषण होते ही ट्रैकिंग नंबर व्हाट्सएप पर भेजा जाता है।" : "A tracking number is sent on WhatsApp as soon as the parcel is dispatched."}</li>
                <li>{hi ? "प्रसाद पाने के लिए बुकिंग फॉर्म में पूरा पता एवं पिनकोड भरना आवश्यक है।" : "A complete address with pincode must be filled in the booking form to receive prasad."}</li>
              </ul>
            </Section>

            <Section h={hi ? "3. भारत के बाहर" : "3. Outside India"}>
              <p>
                {hi
                  ? "अंतरराष्ट्रीय प्रसाद डिलीवरी सीमित देशों में उपलब्ध है और उस पर कूरियर शुल्क लागू होता है। कृपया बुकिंग से पहले व्हाट्सएप पर पुष्टि कर लें। वीडियो एवं प्रमाण-पत्र विश्व में कहीं भी निःशुल्क मिलते हैं।"
                  : "International prasad delivery is available to limited countries and attracts courier charges. Please confirm on WhatsApp before booking. The video and certificate are delivered free anywhere in the world."}
              </p>
            </Section>

            <Section h={hi ? "4. क्षतिग्रस्त अथवा न पहुँचा पार्सल" : "4. Damaged or undelivered parcels"}>
              <p>
                {hi
                  ? "यदि प्रसाद क्षतिग्रस्त पहुँचे अथवा 15 दिन में न पहुँचे, तो बुकिंग आईडी के साथ हमें सूचित करें — हम बिना अतिरिक्त शुल्क के दोबारा भेजेंगे।"
                  : "If the prasad arrives damaged or has not arrived within 15 days, inform us with your Booking ID — we will re-send it at no extra cost."}
              </p>
            </Section>
          </>
        )}

        <hr className="my-8 border-saffron-100" />
        <p className="text-[13px] text-ink/55">
          {hi ? "प्रश्न हो तो संपर्क करें" : "Questions? Reach us at"}: {siteConfig.email} • {siteConfig.phone}
        </p>
      </article>
    </>
  );
}
