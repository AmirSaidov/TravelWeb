import type { Tour } from "@/types";

export type PageType = "home" | "tour_list" | "tour_detail" | "booking" | "ai" | "unknown";

export type PageTourContext = {
  id: string;
  slug: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  duration: string;
  durationDays: number;
  difficulty: string;
  types: string[];
  maxGuests: number;
  rating: number;
  reviewCount: number;
  description: string;
  included: string[];
  highlights: Array<{ title: string; text: string }>;
};

export type PageContext = {
  url: string;
  pageTitle: string;
  visibleText: string;
  buttons: string[];
  links: string[];
  pageType: PageType;
  tourData: PageTourContext | null;
  userAction: string;
};

declare global {
  interface Window {
    __KYRGYZ_TRAVEL_TOUR__?: PageTourContext | null;
    __KYRGYZ_TRAVEL_LAST_ACTION__?: string;
    __KYRGYZ_TRAVEL_ACTION_TRACKING__?: boolean;
  }
}

const VISIBLE_TEXT_LIMIT = 5500;
const MAX_CONTROLS = 60;
const MAX_LABEL_LENGTH = 140;

const compactText = (value: string) => value.replace(/\s+/g, " ").trim();

const truncate = (value: string, limit: number) => {
  const text = compactText(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s+\S*$/, "").trim()}...`;
};

const detectPageType = (pathname: string): PageType => {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/explore")) return "tour_list";
  if (pathname.startsWith("/tour/")) return "tour_detail";
  if (pathname.startsWith("/dashboard") || pathname.includes("booking")) return "booking";
  if (pathname.startsWith("/ai")) return "ai";
  return "unknown";
};

const isVisibleElement = (element: Element) => {
  if (!(element instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const getElementLabel = (element: Element) => {
  if (!(element instanceof HTMLElement)) return "";
  const value =
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    ("value" in element ? String(element.value || "") : "") ||
    element.innerText ||
    element.textContent ||
    "";
  return truncate(value, MAX_LABEL_LENGTH);
};

const getRootElement = () => (document.querySelector("main") as HTMLElement | null) ?? document.body;

const getVisibleText = () => {
  const root = getRootElement();
  return truncate(root.innerText || root.textContent || "", VISIBLE_TEXT_LIMIT);
};

const getButtons = () => {
  const root = getRootElement();
  return Array.from(root.querySelectorAll("button, input[type='button'], input[type='submit'], [role='button']"))
    .filter(isVisibleElement)
    .map(getElementLabel)
    .filter(Boolean)
    .slice(0, MAX_CONTROLS);
};

const getLinks = () => {
  const root = getRootElement();
  return Array.from(root.querySelectorAll("a[href]"))
    .filter(isVisibleElement)
    .map((element) => {
      const label = getElementLabel(element);
      const href = element.getAttribute("href") || "";
      return label ? `${label} (${href})` : href;
    })
    .filter(Boolean)
    .slice(0, MAX_CONTROLS);
};

const describeActionTarget = (element: Element, eventType: string) => {
  const label = getElementLabel(element);
  if (!label) return "";

  const tag = element.tagName.toLowerCase();
  if (tag === "a") return `Clicked link "${label}"`;
  if (tag === "button" || element.getAttribute("role") === "button") return `Clicked button "${label}"`;
  if (eventType === "input" || eventType === "change") return `Editing field "${label}"`;
  return `Focused "${label}"`;
};

export const initPageActionTracking = () => {
  if (typeof window === "undefined" || window.__KYRGYZ_TRAVEL_ACTION_TRACKING__) return;

  window.__KYRGYZ_TRAVEL_ACTION_TRACKING__ = true;
  const updateAction = (event: Event) => {
    const target = event.target instanceof Element
      ? event.target.closest("button, a[href], input, textarea, select, [role='button']")
      : null;
    if (!target) return;

    const action = describeActionTarget(target, event.type);
    if (action) window.__KYRGYZ_TRAVEL_LAST_ACTION__ = action;
  };

  window.addEventListener("click", updateAction, true);
  window.addEventListener("input", updateAction, true);
  window.addEventListener("change", updateAction, true);
  window.addEventListener("focusin", updateAction, true);
};

export const setCurrentTourContext = (tour: Tour | null | undefined) => {
  if (typeof window === "undefined") return;

  window.__KYRGYZ_TRAVEL_TOUR__ = tour
    ? {
        id: tour.id,
        slug: tour.slug,
        title: tour.title,
        location: tour.location,
        price: tour.price,
        currency: tour.currency,
        duration: tour.duration,
        durationDays: tour.durationDays,
        difficulty: tour.difficulty,
        types: tour.types,
        maxGuests: tour.maxGuests,
        rating: tour.rating,
        reviewCount: tour.reviewCount,
        description: truncate(tour.longDescription || tour.description || "", 1200),
        included: tour.included.slice(0, 20),
        highlights: tour.highlights.slice(0, 10).map((item) => ({
          title: item.title,
          text: truncate(item.text, 220),
        })),
      }
    : null;
};

export const getPageContext = (): PageContext => {
  if (typeof window === "undefined") {
    return {
      url: "",
      pageTitle: "",
      visibleText: "",
      buttons: [],
      links: [],
      pageType: "unknown",
      tourData: null,
      userAction: "",
    };
  }

  initPageActionTracking();
  const pathname = window.location.pathname;
  const activeElement =
    document.activeElement && document.activeElement !== document.body
      ? describeActionTarget(document.activeElement, "focusin")
      : "";

  return {
    url: pathname,
    pageTitle: document.title || "",
    visibleText: getVisibleText(),
    buttons: getButtons(),
    links: getLinks(),
    pageType: detectPageType(pathname),
    tourData: window.__KYRGYZ_TRAVEL_TOUR__ ?? null,
    userAction: window.__KYRGYZ_TRAVEL_LAST_ACTION__ || activeElement || `Viewing ${detectPageType(pathname)} page`,
  };
};
