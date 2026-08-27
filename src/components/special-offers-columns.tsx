import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import type { SpecialOffer } from "@/types/special-offer";

export function getSpecialOfferColumns(
  onToggle: (offer: SpecialOffer, enabled: boolean) => void,
  disabled: boolean,
): ColumnDef<SpecialOffer>[] {
  return [
    {
      header: "Aktif",
      id: "enabled",
      enableSorting: false,
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.enabled}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onToggle(row.original, checked === true)
          }
        />
      ),
    },
    {
      header: "Kampanya Adı",
      accessorFn: (row) => row.name ?? "—",
      id: "name",
    },
    {
      header: "Öncelik",
      accessorFn: (row) => row.priority ?? "—",
      id: "priority",
    },
    {
      header: "Başlangıç",
      accessorFn: (row) =>
        row.startsAt ? new Date(row.startsAt).toLocaleString("tr-TR") : "—",
      id: "startsAt",
    },
    {
      header: "Bitiş",
      accessorFn: (row) =>
        row.endsAt ? new Date(row.endsAt).toLocaleString("tr-TR") : "—",
      id: "endsAt",
    },
  ];
}
