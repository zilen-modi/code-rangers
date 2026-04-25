export type TravelQueryType = 'sos' | 'essentials' | 'places';

export type TravelPlace = {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  name: string;
  type: string;
};

export type TravelCategory = {
  category: string;
  categoryLabel: string;
  list: TravelPlace[];
};

export type TravelInfoResponse<TData = Record<string, TravelPlace[]>> = {
  success: boolean;
  data: TData;
};

export type TravelInfoQuery = {
  lat: number;
  lng: number;
  type: TravelQueryType;
};
