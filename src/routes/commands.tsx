import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { ClockIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { axios } from "@/config/api";
import {
  jobMutationKey,
  productsSyncMutationKey,
} from "@/constants/mutationKeys";
import { jobQueryKey } from "@/constants/queryKeys";
import { cn, timeAgo } from "@/lib/utils";
import { sessionAtom } from "@/state/atoms/session";
import { store } from "@/state/store";

type Job = {
  id: number;
  firmId: number;
  frequency: number;
  unit: "hour" | "day" | "month";
  lastRanAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};
const jobQueryOptions = (serverCode: string) =>
  queryOptions({
    queryKey: [jobQueryKey],
    queryFn: async () => {
      return (
        await axios.get<{ message: string; job: Job } | { message: string }>(
          "/admin/jobs",
          {
            params: { serverCode },
          },
        )
      ).data;
    },
    retry: false,
  });

export const Route = createFileRoute("/commands")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      jobQueryOptions(
        // can't be null/undef because we're using authenticated routes
        store.get(sessionAtom)!.serverCode,
      ),
    );
  },
  pendingComponent: () => <Spinner className="size-6" />,
  component: CommandsRouteComponent,
});

function CommandsRouteComponent() {
  const { serverCode } = useAtomValue(sessionAtom)!;
  const queryClient = useQueryClient();

  const productsSyncMutation = useMutation({
    mutationKey: [productsSyncMutationKey],
    mutationFn: async () => {
      return (
        await axios.post<{
          message: string;
          newRowCounts: {
            insertedProductRowsCount: number;
            updatedProductRowsCount: number;
            insertedBarcodeRowsCount: number;
            updatedBarcodeRowsCount: number;
            deletedProductRowsCount: number;
          };
        }>("/admin/products/sync", null, {
          params: { serverCode },
        })
      ).data;
    },
    onSuccess: ({ newRowCounts }) =>
      toast(`Ürünler başarıyla getirildi`, {
        description: `${newRowCounts.insertedProductRowsCount} tane yeni, ${newRowCounts.updatedProductRowsCount} tane değiştirilmiş, ${newRowCounts.deletedProductRowsCount} tane silinen ürün ve ${newRowCounts.insertedBarcodeRowsCount} tane yeni, ${newRowCounts.updatedBarcodeRowsCount} tane değiştirilmiş barkod bulundu.`,
      }),

    onError: (error) => toast(error.message),
  });

  async function syncProducts() {
    if (productsSyncMutation.isPending) return;
    await productsSyncMutation.mutateAsync();
    queryClient.invalidateQueries({ queryKey: [jobQueryKey] });
  }

  const [frequency, setFrequency] = useState(1);

  type Unit = "minute" | "hour" | "day" | "month";
  const [unit, setUnit] = useState<Unit>("day");

  const [jobSaveStateText, setJobSaveStateText] = useState<
    "Kaydediliyor..." | "Kaydedildi" | ""
  >("");

  const [lastRanAt, setLastRanAt] = useState<Date | null>(null);
  const [lastRanAtDisplay, setLastRanAtDisplay] = useState<string | null>(null);

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!lastRanAt) return;

    // update immediately
    setLastRanAtDisplay(timeAgo(lastRanAt));

    const interval = setInterval(() => {
      setLastRanAtDisplay(timeAgo(lastRanAt));
    }, 60_000 /* 60 secs */);

    return () => clearInterval(interval);
  }, [lastRanAt]);

  const jobQuery = useQuery(jobQueryOptions(serverCode));

  useEffect(() => {
    const jobData = jobQuery.data;
    if (jobData && "job" in jobData) {
      setFrequency(jobData.job.frequency);
      setUnit(jobData.job.unit);
      setLastRanAt(
        jobData.job.lastRanAt ? new Date(jobData.job.lastRanAt) : null,
      );
      setIsDirty(false);
    }
  }, [jobQuery.data]);

  const jobMutation = useMutation({
    mutationKey: [jobMutationKey],
    mutationFn: async () => {
      return (
        await axios.post(
          "/admin/jobs",
          { frequency, unit },
          {
            params: { serverCode },
          },
        )
      ).data;
    },
    onError: (error) => {
      toast(error.message);
      setJobSaveStateText("");
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: unwanted behavior
  useEffect(() => {
    if (!isDirty) return;

    setJobSaveStateText("Kaydediliyor...");

    const handler = setTimeout(async () => {
      await jobMutation.mutateAsync();
      setJobSaveStateText("Kaydedildi");
      setIsDirty(false);
    }, 500);

    return () => clearTimeout(handler);
  }, [frequency, unit, isDirty]);

  return (
    <Card
      className={cn(
        "w-full max-w-md",
        productsSyncMutation.isPending && "animate-pulse",
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <RefreshCwIcon
              className={cn(
                "h-4 w-4 text-primary",
                productsSyncMutation.isPending && "animate-spin",
              )}
            />
          </div>
          <div>
            <CardTitle className="text-base">Ürün eşleştirme komutu</CardTitle>
            <CardDescription className="text-xs">
              Arka plan görevi
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="frequency">Bu komut ne kadar sık çalışmalı?</Label>
          <div className="flex gap-2">
            <Input
              id="frequency"
              type="number"
              min={1}
              value={frequency}
              onChange={(e) => {
                setFrequency(Number(e.currentTarget.value));
                setIsDirty(true);
              }}
              placeholder="Sıklık"
              className="w-20"
            />
            <Select
              value={unit}
              onValueChange={(v) => {
                setUnit(v as Unit);
                setIsDirty(true);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minute">Dakikada bir</SelectItem>
                <SelectItem value="hour">Saatte bir</SelectItem>
                <SelectItem value="day">Günde bir</SelectItem>
                <SelectItem value="month">Ayda bir</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground">
            {jobSaveStateText}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>Son çalışma: {lastRanAtDisplay ?? "Çalışmadı"}</span>
        </div>
        <Button
          onClick={syncProducts}
          size="sm"
          className="flex items-center gap-2 cursor-pointer"
        >
          {productsSyncMutation.isPending
            ? "Eşleştiriliyor..."
            : "Şimdi çalıştır"}
        </Button>
      </CardFooter>
    </Card>
  );
}
