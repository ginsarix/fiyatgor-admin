import type { ColumnDef } from "@tanstack/react-table";
import { timeAgo } from "@/lib/utils";

export type FirmSummary = {
  id: number;
  name: string;
  diaServerCode: string;
  diaFirmCode: number;
  createdAt: string;
  updatedAt: string | null;
};

export const firmsColumns: ColumnDef<FirmSummary>[] = [
  {
    header: "#",
    accessorKey: "id",
  },
  {
    header: "Firma Adı",
    accessorKey: "name",
  },
  {
    header: "Sunucu Kodu",
    accessorKey: "diaServerCode",
  },
  {
    header: "Firma Kodu",
    accessorKey: "diaFirmCode",
  },
  {
    header: "Oluşturulma",
    accessorFn: (row) => timeAgo(new Date(row.createdAt)),
    id: "createdAt",
  },
  {
    header: "Güncellenme",
    accessorFn: (row) => (row.updatedAt ? timeAgo(new Date(row.updatedAt)) : "—"),
    id: "updatedAt",
  },
];
