export type Firm = {
  id: number;
  name: string;
  diaServerCode: string;
  diaUsername: string;
  diaPassword: string;
  diaApiKey: string;
  diaFirmCode: number;
  diaPeriodCode: number | null;
  createdAt: string;
  updatedAt: string | null;
};
