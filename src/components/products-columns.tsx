import type { ColumnDef } from "@tanstack/react-table";
import { ScanBarcodeIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type InsertableProduct = {
  stockCode: string;
  name: string;
  price: number;
  currency: string;
  unit: string;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type InsertableBarcode = {
  id: number;
  barcode: string;
  stockCode: string;
};

export type ProductWithBarcodes = InsertableProduct & {
  barcodes: InsertableBarcode[];
};

// Keep old alias for any other consumers
export type Product = InsertableProduct;

// ─── Barcodes Cell ────────────────────────────────────────────────────────────

function BarcodesCell({
  barcodes,
  productName,
  stockCode,
}: {
  barcodes: InsertableBarcode[];
  productName: string;
  stockCode: string;
}) {
  const [open, setOpen] = useState(false);

  if (barcodes.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto cursor-pointer px-1.5 py-0.5"
        >
          <Badge variant="secondary" className="gap-1">
            <ScanBarcodeIcon className="size-3" />
            <span className="font-mono">{barcodes[0].barcode}</span>
            {barcodes.length > 1 && (
              <span className="text-muted-foreground">
                +{barcodes.length - 1} daha fazla...
              </span>
            )}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="leading-snug">{productName}</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {stockCode}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 p-4">
          {barcodes.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <ScanBarcodeIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="font-mono text-sm tracking-wider">
                {b.barcode}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export const columns: ColumnDef<ProductWithBarcodes>[] = [
  {
    header: "Stok Kodu",
    accessorFn: (row) => row.stockCode,
    id: "stockCode",
  },
  {
    header: "Ürün Adı",
    accessorFn: (row) => row.name,
    id: "name",
  },
  {
    header: "Fiyat",
    accessorFn: (row) =>
      new Intl.NumberFormat("tr-TR", {
        style: "decimal",
        minimumFractionDigits: 2,
      }).format(row.price),
    id: "price",
  },
  {
    header: "Döviz",
    accessorFn: (row) => row.currency,
    id: "currency",
    enableSorting: false,
  },
  {
    header: "Stok Miktarı",
    accessorFn: (row) => row.stockQuantity,
    id: "stockQuantity",
  },
  {
    header: "Birim",
    accessorFn: (row) => row.unit,
    id: "unit",
    enableSorting: false,
  },
  {
    header: "Barkodlar",
    id: "barcodes",
    enableSorting: false,
    cell: ({ row }) => (
      <BarcodesCell
        barcodes={row.original.barcodes}
        productName={row.original.name}
        stockCode={row.original.stockCode}
      />
    ),
  },
  {
    header: "Eklenme Tarihi",
    accessorFn: (row) => new Date(row.createdAt).toLocaleDateString("tr-TR"),
    id: "createdAt",
    enableSorting: false,
  },
  {
    header: "Yenilenme Tarihi",
    accessorFn: (row) => new Date(row.updatedAt).toLocaleString("tr-TR"),
    id: "updatedAt",
    enableSorting: false,
  },
];
