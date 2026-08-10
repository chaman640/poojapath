import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, getDict, type Lang } from "./i18n";

/** Server components me current language nikalta hai (cookie se) */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "hi" ? "hi" : "en";
}

export async function getLangDict() {
  const lang = await getLang();
  return { lang, t: getDict(lang) };
}
