import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav: { explore: "Explore", map: "Map", experiences: "Experiences", dashboard: "Dashboard", login: "Sign in", signup: "Sign up" },
      hero: {
        pill: "AI-Powered Travel Guide",
        title: "Kyrgyzstan — where mountains touch the sky",
        subtitle: "Discover the heart of Central Asia. Unspoiled nature, nomadic culture, and epic adventures await.",
      },
      search: { allStays: "All Stays", yurts: "Yurts", tours: "Tours", where: "Where", whereP: "Search destinations", checkin: "Check in", checkout: "Check out", addDates: "Add dates", guests: "Guests", addGuests: "Add guests", search: "Search" },
      categories: { hiking: "Hiking", horse: "Horse tours", cultural: "Cultural", eco: "Eco", yurts: "Yurts", lakes: "Lakes" },
      home: { searchingTitle: "What searching now", searchingSub: "Watch and be inspired by top destinations in Kyrgyzstan", tours: "tours", stays: "stays", person: "person", night: "night" },
      footer: { rights: "All rights reserved.", privacy: "Privacy", terms: "Terms", sitemap: "Sitemap", destinations: "Destinations", info: "Information", newsletter: "Newsletter", newsletterSub: "Get travel inspiration and secret deals.", emailP: "Email address", join: "Join", travelVisa: "Travel Visa", bestTime: "Best Time to Visit", etiquette: "Cultural Etiquette", safety: "Safety Tips", about: "We empower travelers to experience the raw beauty of Kyrgyzstan while supporting local nomadic communities and preserving nature." },
      explore: { title: "Tours in Kyrgyzstan", count: "Discover {{n}} curated adventures across the Tian Shan", searchP: "Search tours or locations…", sort: "Sort: Popular", priceRange: "Price range", duration: "Duration", difficulty: "Difficulty", tourType: "Tour type", easy: "Easy", moderate: "Moderate", challenging: "Challenging", sustainable: "Sustainable Travel", sustainableText: "Book any eco-tour this month and we'll plant 10 trees in the Ala-Archa valley.", learnMore: "Learn more" },
      tour: { reviews: "reviews", showAll: "Show all photos", share: "Share", save: "Save", hostedBy: "Hosted by", about: "About this experience", showMore: "Show more", included: "What's included", bookNow: "Book Now", notCharged: "You won't be charged yet", startDate: "START DATE", endDate: "END DATE", guestsLabel: "GUESTS", adults: "{{n}} adults", ecoFee: "Eco-sustainability fee", serviceFee: "Service fee", total: "Total", freeCancellation: "Free cancellation before {{date}}" },
      ai: { title: "Kyrgyz Travel AI", status: "EXPERT GUIDE ONLINE", placeholder: "Ask anything about your trip…", suggestPack: "What should I pack?", suggestHotel: "Find hotels in Karakol", suggestWeather: "Weather forecast", proposed: "PROPOSED TIMELINE", day: "DAY", disclaimer: "AI can make mistakes. Verify important information like visas and safety." },
      auth: { signin: "Sign in", signup: "Create account", email: "Email", phone: "Phone", password: "Password", forgot: "Forgot password?", noAccount: "Don't have an account?", haveAccount: "Already have an account?", continueGoogle: "Continue with Google", or: "or", reset: "Reset password", resetSub: "We'll email you a reset link.", sendLink: "Send reset link" },
      dashboard: { title: "My account", bookings: "My Bookings", history: "Trip History", profile: "Profile", saved: "Saved", upcoming: "Upcoming", completed: "Completed", cancelled: "Cancelled", noBookings: "No bookings yet — explore tours to get started.", saveProfile: "Save changes" },
    },
  },
  ru: {
    translation: {
      nav: { explore: "Туры", map: "Карта", experiences: "Опыт", dashboard: "Кабинет", login: "Войти", signup: "Регистрация" },
      hero: {
        pill: "AI-помощник путешественника",
        title: "Кыргызстан — где горы касаются неба",
        subtitle: "Откройте сердце Центральной Азии. Дикая природа, кочевая культура и эпические приключения.",
      },
      search: { allStays: "Жильё", yurts: "Юрты", tours: "Туры", where: "Куда", whereP: "Поиск направлений", checkin: "Заезд", checkout: "Выезд", addDates: "Добавьте даты", guests: "Гости", addGuests: "Сколько гостей", search: "Поиск" },
      categories: { hiking: "Походы", horse: "Конные", cultural: "Культурные", eco: "Эко", yurts: "Юрты", lakes: "Озёра" },
      home: { searchingTitle: "Сейчас ищут", searchingSub: "Топ-направления Кыргызстана", tours: "туров", stays: "жилья", person: "чел", night: "ночь" },
      footer: { rights: "Все права защищены.", privacy: "Политика", terms: "Условия", sitemap: "Карта сайта", destinations: "Направления", info: "Информация", newsletter: "Рассылка", newsletterSub: "Вдохновение и скидки на ваш email.", emailP: "Email", join: "Подписаться", travelVisa: "Визы", bestTime: "Когда ехать", etiquette: "Этикет", safety: "Безопасность", about: "Помогаем путешественникам открыть Кыргызстан и поддерживать местные сообщества." },
      explore: { title: "Туры по Кыргызстану", count: "{{n}} тщательно отобранных приключений по Тянь-Шаню", searchP: "Поиск туров или мест…", sort: "Сорт.: Популярные", priceRange: "Цена", duration: "Длительность", difficulty: "Сложность", tourType: "Тип тура", easy: "Лёгкий", moderate: "Средний", challenging: "Сложный", sustainable: "Эко-путешествия", sustainableText: "Бронируя эко-тур в этом месяце, вы сажаете 10 деревьев в Ала-Арче.", learnMore: "Подробнее" },
      tour: { reviews: "отзывов", showAll: "Все фото", share: "Поделиться", save: "Сохранить", hostedBy: "Организатор", about: "Об опыте", showMore: "Показать ещё", included: "Что включено", bookNow: "Забронировать", notCharged: "Оплата позже", startDate: "ДАТА НАЧАЛА", endDate: "ДАТА ОКОНЧАНИЯ", guestsLabel: "ГОСТИ", adults: "{{n}} взрослых", ecoFee: "Эко-сбор", serviceFee: "Сервисный сбор", total: "Итого", freeCancellation: "Бесплатная отмена до {{date}}" },
      ai: { title: "Kyrgyz Travel AI", status: "ЭКСПЕРТ ОНЛАЙН", placeholder: "Спросите о вашем путешествии…", suggestPack: "Что взять с собой?", suggestHotel: "Отели в Караколе", suggestWeather: "Прогноз погоды", proposed: "МАРШРУТ", day: "ДЕНЬ", disclaimer: "AI может ошибаться. Проверяйте визы и правила безопасности." },
      auth: { signin: "Войти", signup: "Создать аккаунт", email: "Email", phone: "Телефон", password: "Пароль", forgot: "Забыли пароль?", noAccount: "Нет аккаунта?", haveAccount: "Уже есть аккаунт?", continueGoogle: "Войти через Google", or: "или", reset: "Сброс пароля", resetSub: "Мы отправим ссылку на email.", sendLink: "Отправить ссылку" },
      dashboard: { title: "Мой кабинет", bookings: "Бронирования", history: "История", profile: "Профиль", saved: "Избранное", upcoming: "Предстоящие", completed: "Завершённые", cancelled: "Отменённые", noBookings: "Пока нет бронирований — начните с поиска туров.", saveProfile: "Сохранить" },
    },
  },
  kg: {
    translation: {
      nav: { explore: "Турлар", map: "Карта", experiences: "Тажрыйба", dashboard: "Кабинет", login: "Кирүү", signup: "Каттоо" },
      hero: {
        pill: "AI саякат жардамчысы",
        title: "Кыргызстан — тоолор асманга жеткен жер",
        subtitle: "Борбордук Азиянын жүрөгүн ачыңыз. Жапайы жаратылыш, көчмөн маданияты жана улуу укмуштар.",
      },
      search: { allStays: "Турак", yurts: "Боз үй", tours: "Турлар", where: "Кайда", whereP: "Багытты издөө", checkin: "Келүү", checkout: "Кетүү", addDates: "Күндөрдү тандаңыз", guests: "Конок", addGuests: "Канча конок", search: "Издөө" },
      categories: { hiking: "Жөө сейил", horse: "Ат менен", cultural: "Маданий", eco: "Эко", yurts: "Боз үй", lakes: "Көлдөр" },
      home: { searchingTitle: "Азыр изделүүдө", searchingSub: "Кыргызстандагы мыкты багыттар", tours: "тур", stays: "турак", person: "адам", night: "түн" },
      footer: { rights: "Бардык укуктар корголгон.", privacy: "Купуялык", terms: "Шарттар", sitemap: "Сайт картасы", destinations: "Багыттар", info: "Маалымат", newsletter: "Жаңылыктар", newsletterSub: "Эң жакшы сунуштар email менен.", emailP: "Email", join: "Жазылуу", travelVisa: "Виза", bestTime: "Качан баруу", etiquette: "Адеп", safety: "Коопсуздук", about: "Кыргызстандын кооздугун ачабыз жана жергиликтүү жамааттарды колдойбуз." },
      explore: { title: "Кыргызстан боюнча турлар", count: "Тянь-Шань боюнча {{n}} тандалган укмуш", searchP: "Турларды издөө…", sort: "Иргөө: Популярдуу", priceRange: "Баа", duration: "Узактыгы", difficulty: "Татаалдык", tourType: "Тур түрү", easy: "Жеңил", moderate: "Орточо", challenging: "Татаал", sustainable: "Эко-саякат", sustainableText: "Эко-турга жазылып, Ала-Арчада 10 дарак отургузабыз.", learnMore: "Толугураак" },
      tour: { reviews: "пикир", showAll: "Бардык сүрөттөр", share: "Бөлүшүү", save: "Сактоо", hostedBy: "Уюштуруучу", about: "Тур жөнүндө", showMore: "Дагы көрсөтүү", included: "Камтылган", bookNow: "Брондоо", notCharged: "Азырынча акча алынбайт", startDate: "БАШТАЛЫШ", endDate: "БҮТҮҮ", guestsLabel: "КОНОК", adults: "{{n}} чоң киши", ecoFee: "Эко-салым", serviceFee: "Кызмат акысы", total: "Жалпы", freeCancellation: "{{date}} чейин акысыз жокко чыгаруу" },
      ai: { title: "Kyrgyz Travel AI", status: "ЭКСПЕРТ ОНЛАЙН", placeholder: "Сапарыңыз жөнүндө сураңыз…", suggestPack: "Эмне алуу керек?", suggestHotel: "Каракол отелдери", suggestWeather: "Аба ырайы", proposed: "МАРШРУТ", day: "КҮН", disclaimer: "AI кателешиши мүмкүн. Виза жана коопсуздук маалыматын текшериңиз." },
      auth: { signin: "Кирүү", signup: "Каттоо", email: "Email", phone: "Телефон", password: "Сырсөз", forgot: "Сырсөздү унуттуңузбу?", noAccount: "Аккаунт жокпу?", haveAccount: "Аккаунт барбы?", continueGoogle: "Google аркылуу", or: "же", reset: "Сырсөздү жаңылоо", resetSub: "Email боюнча шилтеме жөнөтөбүз.", sendLink: "Шилтеме жөнөтүү" },
      dashboard: { title: "Менин кабинетим", bookings: "Брондоолор", history: "Тарых", profile: "Профиль", saved: "Сакталган", upcoming: "Алдыдагы", completed: "Аякталган", cancelled: "Жокко чыгарылган", noBookings: "Брондоолор жок — турлардан баштаңыз.", saveProfile: "Сактоо" },
    },
  },
};

const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;

i18n.use(initReactI18next).init({
  resources,
  lng: stored || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
