import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { useCallback, useState } from "react";
import {
  columns,
  type InsertableBarcode,
  type InsertableProduct,
  type ProductWithBarcodes,
} from "@/components/products-columns";
import { DataTable } from "@/components/products-data-table";
import { Spinner } from "@/components/ui/spinner";
import { axios } from "@/config/api";
import { productsQueryKey } from "@/constants/queryKeys";
import { sessionAtom } from "@/state/atoms/session";
import { store } from "@/state/store";

type ProductJoinRow = {
  products: InsertableProduct;
  barcodes: InsertableBarcode | null;
};

function groupProductRows(rows: ProductJoinRow[]): ProductWithBarcodes[] {
  const map = new Map<string, ProductWithBarcodes>();
  for (const row of rows) {
    const existing = map.get(row.products.stockCode);
    if (existing) {
      if (row.barcodes) existing.barcodes.push(row.barcodes);
    } else {
      map.set(row.products.stockCode, {
        ...row.products,
        barcodes: row.barcodes ? [row.barcodes] : [],
      });
    }
  }
  return Array.from(map.values());
}

type SortBy = "name" | "price" | "stockCode" | "status" | "stockQuantity";

const productsQueryOptions = (
  serverCode: string,
  page = 1,
  limit = 20,
  search?: string,
  sortBy: SortBy = "name",
  sortOrder: "asc" | "desc" = "asc",
) =>
  queryOptions({
    staleTime: 1000 * 60 * 5,
    queryKey: [
      productsQueryKey,
      serverCode,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    ],
    queryFn: async () =>
      (
        await axios.get<{
          message: string;
          products: ProductJoinRow[];
          rowCount: number;
        }>("/admin/products", {
          params: { serverCode, page, limit, search, sortBy, sortOrder },
        })
      ).data,
  });

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(
      productsQueryOptions(store.get(sessionAtom)!.serverCode),
    );
  },
  pendingComponent: () => <Spinner className="size-6" />,
  component: HomeComponent,
  errorComponent: () => (
    <div className="text-red-400 p-3 rounded-lg">
      Ürünler getirilirken bir hata ile karşılaşıldı
    </div>
  ),
});

function HomeComponent() {
  const session = useAtomValue(sessionAtom);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState<string | undefined>(undefined);

  const sortBy = (sorting[0]?.id as SortBy | undefined) ?? "name";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const { data } = useSuspenseQuery(
    productsQueryOptions(
      session!.serverCode,
      pagination.pageIndex + 1,
      pagination.pageSize,
      search,
      sortBy,
      sortOrder,
    ),
  );

  const handleSort = useCallback<typeof setSorting>((updater) => {
    setSorting(updater);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value.trim() === "" ? undefined : value.trim());
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const products = groupProductRows(data.products);

  return (
    <div className="p-5">
      <DataTable
        columns={columns}
        data={products}
        rowCount={data.rowCount}
        pagination={pagination}
        sorting={sorting}
        onPaginate={setPagination}
        onSort={handleSort}
        onSearch={handleSearch}
      />
    </div>
  );
}
