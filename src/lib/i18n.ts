import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "@/locales/en/common.json";
import enCalendar from "@/locales/en/calendar.json";
import enSettings from "@/locales/en/settings.json";
import zhCommon from "@/locales/zh/common.json";
import zhCalendar from "@/locales/zh/calendar.json";
import zhSettings from "@/locales/zh/settings.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "zh",
    defaultNS: "common",
    resources: {
      en: { common: enCommon, calendar: enCalendar, settings: enSettings },
      zh: { common: zhCommon, calendar: zhCalendar, settings: zhSettings },
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
