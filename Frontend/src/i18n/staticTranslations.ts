import type { SiteLang } from "@/i18n/siteLang";

export const staticTranslations: Record<
  SiteLang,
  {
    header: {
      themeToggleAria: string;
      currencyAuto: string;
      changeAvatar: string;
      removeAvatar: string;
      signOut: string;
    };
  }
> = {
  en: {
    header: {
      themeToggleAria: "Toggle theme",
      currencyAuto: "Auto",
      changeAvatar: "Change avatar…",
      removeAvatar: "Remove avatar",
      signOut: "Sign out",
    },
  },
  ru: {
    header: {
      themeToggleAria: "Переключить тему",
      currencyAuto: "Авто",
      changeAvatar: "Сменить аватар…",
      removeAvatar: "Удалить аватар",
      signOut: "Выйти",
    },
  },
  ky: {
    header: {
      themeToggleAria: "Теманы алмаштыруу",
      currencyAuto: "Авто",
      changeAvatar: "Аватарды өзгөртүү…",
      removeAvatar: "Аватарды өчүрүү",
      signOut: "Чыгуу",
    },
  },
};

