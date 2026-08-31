import { queryOptions } from "@tanstack/react-query";
import { axios } from "@/config/api";
import { productSyncStatusQueryKey } from "@/constants/queryKeys";

export type SyncRowCounts = {
  insertedProductRowsCount: number;
  updatedProductRowsCount: number;
  insertedBarcodeRowsCount: number;
  updatedBarcodeRowsCount: number;
  deletedProductRowsCount: number;
};

export type ProductSyncStatus =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; newRowCounts: SyncRowCounts }
  | { status: "error"; message: string };

export function syncResultDescription(newRowCounts: SyncRowCounts) {
  return `${newRowCounts.insertedProductRowsCount} tane yeni, ${newRowCounts.updatedProductRowsCount} tane değiştirilmiş, ${newRowCounts.deletedProductRowsCount} tane silinen ürün ve ${newRowCounts.insertedBarcodeRowsCount} tane yeni, ${newRowCounts.updatedBarcodeRowsCount} tane değiştirilmiş barkod bulundu.`;
}

// polls the background full-sync status so the UI (and the completion toast) stays correct
// even across a page reload or navigation while a sync is still running
export const syncStatusQueryOptions = (firmCode: string) =>
  queryOptions({
    queryKey: [productSyncStatusQueryKey],
    queryFn: async () =>
      (
        await axios.get<{ status: ProductSyncStatus }>(
          "/admin/products/sync/status",
          { params: { firmCode } },
        )
      ).data,
    refetchInterval: (query) =>
      query.state.data?.status.status === "running" ? 2500 : false,
  });
