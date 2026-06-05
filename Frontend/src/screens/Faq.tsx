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
    <div className="container-page py-10 sm:py-12 lg:py-14">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        <div className="max-w-xl space-y-4">
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{t("faq.title")}</h1>
          <p className="text-base text-muted-foreground">{t("faq.subtitle")}</p>
        </div>

        <FaqClient
          items={items}
          searchPlaceholder={t("faq.searchP")}
          noResultsText={t("faq.noResults")}
        />
      </div>
    </div>
  );
};

export default Faq;
