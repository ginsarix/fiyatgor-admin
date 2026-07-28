import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { ProductAdd } from "@/components/product-add";
import {
  getProductColumns,
  type InsertableBarcode,
  type InsertableProduct,
  type ProductWithBarcodes,
} from "@/components/products-columns";
import { DataTable } from "@/components/products-data-table";
import { Spinner } from "@/components/ui/spinner";
import { axios } from "@/config/api";
import { firmQueryKey, productsQueryKey } from "@/constants/queryKeys";
import { sessionAtom } from "@/state/atoms/session";
import { store } from "@/state/store";
import type { Firm } from "@/types/firm";

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
  firmCode: string,
  page = 1,
  limit = 20,
  search?: string,
  sortBy: SortBy = "stockCode",
  sortOrder: "asc" | "desc" = "asc",
) =>
  queryOptions({
    staleTime: 1000 * 60 * 5,
    queryKey: [
      productsQueryKey,
      firmCode,
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
          params: { firmCode, page, limit, search, sortBy, sortOrder },
        })
      ).data,
  });

const firmQueryOptions = (firmCode: string) =>
  queryOptions({
    queryKey: [firmQueryKey],
    queryFn: async () =>
      (
        await axios.get<{ message: string; firm: Firm }>("/admin/firm", {
          params: { firmCode },
        })
      ).data,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const { firmCode } = store.get(sessionAtom)!;
    const [productsData] = await Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions(firmCode)),
      context.queryClient.prefetchQuery(firmQueryOptions(firmCode)),
    ]);
    return productsData;
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

  const sortBy = (sorting[0]?.id as SortBy | undefined) ?? "stockCode";
  const sortOrder = sorting[0]?.desc ? "asc" : "desc";

  const { data } = useSuspenseQuery(
    productsQueryOptions(
      session!.firmCode,
      pagination.pageIndex + 1,
      pagination.pageSize,
      search,
      sortBy,
      sortOrder,
    ),
  );

  const firmQuery = useQuery(firmQueryOptions(session!.firmCode));
  const discountsEnabled = firmQuery.data?.firm.discountsEnabled ?? false;
  const columns = useMemo(
    () => getProductColumns(discountsEnabled),
    [discountsEnabled],
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
    <div className="w-full min-w-0 justify-self-stretch p-5">
      <div className="mb-3 flex justify-end">
        <ProductAdd />
      </div>
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
