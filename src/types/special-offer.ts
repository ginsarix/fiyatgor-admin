export type SpecialOffer = {
  id: number;
  firmId: number;
  diaKey: number;
  enabled: boolean;
  name: string | null;
  priority: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};
