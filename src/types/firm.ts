export type Firm = {
  id: number;
  firmCode: string;
  name: string;
  diaServerCode: string | null;
  diaUsername: string | null;
  diaPassword: string | null;
  diaApiKey: string | null;
  diaFirmCode: number | null;
  diaPeriodCode: number | null;
  priceField:
    | "fiyat1"
    | "fiyat2"
    | "fiyat3"
    | "fiyat4"
    | "fiyat5"
    | "fiyat6"
    | "fiyat7"
    | "fiyat8"
    | "fiyat9"
    | "fiyat10";
  maxProductNameCharacters: number | null;
  createdAt: string;
  updatedAt: string | null;
};
