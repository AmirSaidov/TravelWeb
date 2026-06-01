import { getServerTranslation } from "@/i18n/server";
import { FaqClient } from "./FaqClient";

const Faq = () => {
  const { t } = getServerTranslation();

  const items = [
    { id: "language", q: t("faq.language.q"), a: t("faq.language.a"), tags: ["language", "i18n"] },
    { id: "currency", q: t("faq.currency.q"), a: t("faq.currency.a"), tags: ["currency", "prices"] },
    { id: "booking", q: t("faq.booking.q"), a: t("faq.booking.a"), tags: ["booking"] },
    { id: "payment", q: t("faq.payment.q"), a: t("faq.payment.a"), tags: ["payment"] },
    { id: "cancellation", q: t("faq.cancellation.q"), a: t("faq.cancellation.a"), tags: ["cancellation"] },
  ];

  return (
    <div className="container-page py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{t("faq.title")}</h1>
          <p className="mt-4 text-base text-muted-foreground">{t("faq.subtitle")}</p>
        </div>

        <FaqClient items={items} searchPlaceholder={t("faq.searchP")} noResultsText={t("faq.noResults")} />
      </div>
    </div>
  );
};

export default Faq;

