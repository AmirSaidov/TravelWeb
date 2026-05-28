"use client";

import { useTranslation } from "react-i18next";
import { fromI18nLang } from "@/i18n/siteLang";
import { staticTranslations } from "@/i18n/staticTranslations";

export function useStaticT() {
  const { i18n } = useTranslation();
  const currentLang = fromI18nLang(i18n.language);
  return staticTranslations[currentLang];
}
