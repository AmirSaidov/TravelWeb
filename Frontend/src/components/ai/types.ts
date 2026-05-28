export type TourCard = {
  type: "tour";
  id: number;
  title: string;
  price?: number | string;
  currency?: string;
  duration_days?: number;
  destination?: string;
  difficulty?: string;
  description?: string;
  image?: string | null;
  url: string;
};

export type WeatherCard = {
  type: "weather";
  location: string;
  temperature?: number | string | null;
  description?: string;
  wind_speed?: number | string | null;
  precipitation?: number | string | null;
  temp_min?: number | string | null;
  temp_max?: number | string | null;
  recommendation?: string;
};

export type AICard = TourCard | WeatherCard;

export type AIResponse = {
  answer: string;
  cards?: AICard[];
  conversation_id?: number;
};
