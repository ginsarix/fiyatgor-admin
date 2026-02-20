import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export type UserSummary = {
  id: number;
  name: string;
  email: string;
  firmId: number;
  role: "admin" | "superadmin";
  createdAt: string;
  updatedAt: string | null;
};

export const usersColumns: ColumnDef<UserSummary>[] = [
  {
    header: "#",
    accessorKey: "id",
  },
  {
    header: "Ad Soyad",
    accessorKey: "name",
  },
  {
    header: "E-posta",
    accessorKey: "email",
  },
  {
    header: "Firma ID",
    accessorKey: "firmId",
  },
  {
    header: "Rol",
    accessorKey: "role",
    cell: ({ getValue }) => {
      const role = getValue<UserSummary["role"]>();
      return (
        <Badge variant={role === "superadmin" ? "default" : "secondary"}>
          {role === "superadmin" ? "Süper Admin" : "Admin"}
        </Badge>
      );
    },
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
];
