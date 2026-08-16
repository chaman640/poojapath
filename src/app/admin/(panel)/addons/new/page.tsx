import Link from "next/link";
import AddonForm, { type AddonFormValues } from "../AddonForm";

export const dynamic = "force-dynamic";

export default function NewAddonPage() {
  const initial: AddonFormValues = {
    slug: "",
    nameEn: "",
    nameHi: "",
    descEn: "",
    descHi: "",
    price: 251,
    imageUrl: "",
    artKey: "kalash",
    kind: "DELIVERY",
    isActive: true,
    order: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/addons" className="text-[13px] font-semibold text-saffron-700">
          ← Add-ons
        </Link>
        <h1 className="mt-1 text-2xl">Naya add-on</h1>
      </div>

      <AddonForm initial={initial} />
    </div>
  );
}
