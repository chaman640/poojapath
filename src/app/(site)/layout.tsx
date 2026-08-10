import { LanguageProvider } from "@/components/LanguageProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsappFloat from "@/components/WhatsappFloat";
import { getLang } from "@/lib/lang-server";
import { siteConfig } from "@/lib/env";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();

  return (
    <LanguageProvider lang={lang}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer
        phone={siteConfig.phone}
        whatsapp={siteConfig.whatsapp}
        email={siteConfig.email}
      />
      <WhatsappFloat whatsapp={siteConfig.whatsapp} />
    </LanguageProvider>
  );
}
