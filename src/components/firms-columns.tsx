import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { EditIcon, TrashIcon } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import {
  selectedFirmIdAtom,
  selectedFirmMutationModeAtom,
} from "@/state/atoms/firm";
import { store } from "@/state/store";
import { Button } from "./ui/button";

export type FirmSummary = {
  id: number;
  name: string;
  diaServerCode: string;
  diaFirmCode: number;
  createdAt: string;
  updatedAt: string | null;
};

const columnHelper = createColumnHelper<FirmSummary>();

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
    accessorFn: (row) =>
      row.updatedAt ? timeAgo(new Date(row.updatedAt)) : "—",
    id: "updatedAt",
  },
  columnHelper.display({
    id: "actions",
    header: "Eylemler",
    cell: (props) => (
      <>
        <Button
          className="me-1 cursor-pointer text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10! transition-colors"
          size="icon-sm"
          variant="outline"
          onClick={() => {
            store.set(selectedFirmIdAtom, props.row.original.id);
            store.set(selectedFirmMutationModeAtom, "update");
          }}
        >
          <EditIcon />
        </Button>
        <Button
          className="cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10! transition-colors"
          variant="outline"
          size="icon-sm"
          onClick={() => {
            store.set(selectedFirmIdAtom, props.row.original.id);
            store.set(selectedFirmMutationModeAtom, "delete");
          }}
        >
          <TrashIcon />
        </Button>
      </>
    ),
  }),
];
