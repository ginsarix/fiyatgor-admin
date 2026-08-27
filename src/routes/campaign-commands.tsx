import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { BadgePercentIcon, InfoIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/products-data-table";
import { getSpecialOfferColumns } from "@/components/special-offers-columns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { axios } from "@/config/api";
import {
  specialOffersSyncMutationKey,
  specialOfferToggleMutationKey,
} from "@/constants/mutationKeys";
import {
  firmQueryKey,
  productsQueryKey,
  specialOffersQueryKey,
} from "@/constants/queryKeys";
import { cn } from "@/lib/utils";
import { sessionAtom } from "@/state/atoms/session";
import { store } from "@/state/store";
import type { SpecialOffer } from "@/types/special-offer";

type SortBy = "name" | "priority" | "startsAt" | "endsAt";

const firmQueryOptions = (firmCode: string) =>
  queryOptions({
    queryKey: [firmQueryKey],
    queryFn: async () =>
      (
        await axios.get<{
          message: string;
          firm: {
            diaServerCode: string | null;
            diaFirmCode: number | null;
            discountsEnabled: boolean;
            estimatedNextSyncCost: string | null;
          };
        }>("/admin/firm", { params: { firmCode } })
      ).data,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

const specialOffersQueryOptions = (
  firmCode: string,
  page = 1,
  limit = 20,
  search?: string,
  sortBy: SortBy = "name",
  sortOrder: "asc" | "desc" = "desc",
) =>
  queryOptions({
    staleTime: 1000 * 60 * 5,
    queryKey: [
      specialOffersQueryKey,
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
          specialOffers: SpecialOffer[];
          rowCount: number;
        }>("/admin/special-offers", {
          params: { firmCode, page, limit, search, sortBy, sortOrder },
        })
      ).data,
  });

export const Route = createFileRoute("/campaign-commands")({
  loader: async ({ context }) => {
    const { firmCode } = store.get(sessionAtom)!;

    const firmData = await context.queryClient.ensureQueryData(
      firmQueryOptions(firmCode),
    );

    if (
      !firmData.firm?.diaServerCode ||
      !firmData.firm?.diaFirmCode ||
      !firmData.firm?.discountsEnabled
    ) {
      throw redirect({ to: "/settings" });
    }

    await context.queryClient.ensureQueryData(
      specialOffersQueryOptions(firmCode),
    );
  },
  pendingComponent: () => <Spinner className="size-6" />,
  component: CampaignCommandsRouteComponent,
});

function CampaignCommandsRouteComponent() {
  const { firmCode } = useAtomValue(sessionAtom)!;
  const queryClient = useQueryClient();

  const firmQuery = useQuery(firmQueryOptions(firmCode));

  const syncMutation = useMutation({
    mutationKey: [specialOffersSyncMutationKey],
    mutationFn: async () => {
      return (
        await axios.post<{
          message: string;
          offersSeen: number;
          addedCount: number;
          updatedCount: number;
          removedCount: number;
          discountedProductCount: number;
          hasSyncedProducts: boolean;
        }>("/admin/special-offers/sync", null, { params: { firmCode } })
      ).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [specialOffersQueryKey] });
      queryClient.invalidateQueries({ queryKey: [firmQueryKey] });
      queryClient.invalidateQueries({ queryKey: [productsQueryKey] });

      toast("Kampanyalar başarıyla eşleştirildi", {
        description: `${data.addedCount} tane yeni, ${data.updatedCount} tane değiştirilmiş, ${data.removedCount} tane silinen kampanya bulundu. ${data.discountedProductCount} ürün şu anda indirimli.`,
      });

      if (!data.hasSyncedProducts) {
        toast.warning(
          "Lütfen kampanyaları eşleştirmeden önce bu seferlik 1 kez ürünleri eşleştirin. Bunu bir daha yapmanıza gerek olmayacaktır.",
          { duration: 10000 },
        );
      }
    },
    onError: (error) => toast(error.message),
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState<string | undefined>(undefined);

  const sortBy = (sorting[0]?.id as SortBy | undefined) ?? "name";
  const sortOrder = sorting[0]?.desc ? "asc" : "desc";

  const { data } = useSuspenseQuery(
    specialOffersQueryOptions(
      firmCode,
      pagination.pageIndex + 1,
      pagination.pageSize,
      search,
      sortBy,
      sortOrder,
    ),
  );

  const toggleMutation = useMutation({
    mutationKey: [specialOfferToggleMutationKey],
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return (
        await axios.patch<{
          message: string;
          specialOffer: SpecialOffer;
          discountedProductCount: number;
          hasSyncedProducts: boolean;
        }>(`/admin/special-offers/${id}`, { enabled }, { params: { firmCode } })
      ).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [specialOffersQueryKey] });
      queryClient.invalidateQueries({ queryKey: [productsQueryKey] });

      if (!data.hasSyncedProducts) {
        toast.warning(
          "Lütfen kampanyaları eşleştirmeden önce bu seferlik 1 kez ürünleri eşleştirin. Bunu bir daha yapmanıza gerek olmayacaktır.",
          { duration: 10000 },
        );
      }
    },
    onError: (error) => toast(error.message),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: toggleMutation is a new object every render, so only its stable mutate reference and its isPending flag are tracked deliberately
  const columns = useMemo(
    () =>
      getSpecialOfferColumns(
        (offer, enabled) => toggleMutation.mutate({ id: offer.id, enabled }),
        toggleMutation.isPending,
      ),
    [toggleMutation.mutate, toggleMutation.isPending],
  );

  const handleSort = useCallback<typeof setSorting>((updater) => {
    setSorting(updater);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value.trim() === "" ? undefined : value.trim());
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  return (
    <div className="w-full min-w-0 justify-self-stretch space-y-4 p-5">
      <Card className={cn(syncMutation.isPending && "animate-pulse")}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <BadgePercentIcon
                className={cn(
                  "h-4 w-4 text-primary",
                  syncMutation.isPending && "animate-spin",
                )}
              />
            </div>
            <div>
              <CardTitle className="text-base">
                Kampanya eşleştirme komutu
              </CardTitle>
              <CardDescription className="text-xs">
                Manuel komut
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="space-y-1">
              <p>
                DIA Web Servisi'nin kısıtlamaları nedeniyle kampanya
                bilgileri tek tek sorgulanmak zorunda kalıyor; bu yüzden her
                eşleştirmede kampanya sayısı kadar ekstra DIA kontörü
                harcanıyor.
              </p>
              {firmQuery.data?.firm.estimatedNextSyncCost != null && (
                <p className="font-medium text-foreground">
                  Sonraki eşleştirmenin tahmini maliyeti:{" "}
                  {new Intl.NumberFormat("tr-TR", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  }).format(Number(firmQuery.data.firm.estimatedNextSyncCost))}{" "}
                  kontör
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button
            onClick={() => syncMutation.mutate()}
            size="sm"
            className="flex items-center gap-2 cursor-pointer"
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? "Eşleştiriliyor..." : "Şimdi çalıştır"}
          </Button>
        </CardFooter>
      </Card>

      <DataTable
        columns={columns}
        data={data.specialOffers}
        rowCount={data.rowCount}
        pagination={pagination}
        sorting={sorting}
        onPaginate={setPagination}
        onSort={handleSort}
        onSearch={handleSearch}
        searchPlaceholder="Kampanya adı ara..."
      />
    </div>
  );
}
