import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { axios } from "@/config/api";
import { firmsQueryKey } from "@/constants/queryKeys";
import { filterEmptyFields } from "@/lib/utils";
import {
  selectedFirmIdAtom,
  selectedFirmMutationModeAtom,
} from "@/state/atoms/firm";
import type { Firm } from "@/types/firm";
import { firmSchema } from "@/validations/zod-schemas";
import { Separator } from "./ui/separator";

type FirmFormValues = z.infer<typeof firmSchema>;

export function FirmUpdateModal() {
  const queryClient = useQueryClient();

  const [selectedFirmId, setSelectedFirmId] = useAtom(selectedFirmIdAtom);
  const [selectedFirmMutationMode, setSelectedFirmMutationMode] = useAtom(
    selectedFirmMutationModeAtom,
  );
  const modalOpen = selectedFirmMutationMode === "update";

  const firmMutation = useMutation({
    mutationFn: async (data: FirmFormValues) => {
      const payload = filterEmptyFields(data);
      return (
        await axios.patch<{ message: string; updatedFirm: Firm }>(
          `/superadmin/firms/${selectedFirmId}`,
          payload,
        )
      ).data;
    },
    onSuccess: ({ updatedFirm }) => {
      setSelectedFirmId(null);
      setSelectedFirmMutationMode(null);

      toast("Firma güncellendi", {
        description: "Firma bilgileri başarıyla kaydedildi.",
      });
      queryClient.setQueryData(
        [firmsQueryKey],
        (oldData: { message: string; firms: Firm[] }) => {
          const newFirms = {
            message: "Firmalar başarıyla getirildi",
            firms: oldData.firms.map((firm) =>
              firm.id === updatedFirm.id ? updatedFirm : firm,
            ),
          };

          return newFirms;
        },
      );
    },
    onError: (error) => toast(error.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(firmSchema),
    defaultValues: {
      name: "",
      diaUsername: "",
      diaPassword: "",
      diaApiKey: "",
      diaFirmCode: 0,
      diaPeriodCode: 0,
    },
  });

  useEffect(() => {
    const firm = queryClient
      .getQueryData<{ message: string; firms: Firm[] }>([firmsQueryKey])
      ?.firms.find((firm) => firm.id === selectedFirmId);

    if (firm) reset(firm);
  }, [reset, queryClient, selectedFirmId]);

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedFirmId(null);
          setSelectedFirmMutationMode(null);
        }
      }}
    >
      <DialogContent className="w-full max-w-[90vw] md:max-w-[600px]">
        <form
          className="contents"
          noValidate
          onSubmit={handleSubmit((data) => firmMutation.mutateAsync(data))}
        >
          <DialogHeader>
            <DialogTitle>Firmayı Düzenle</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="firm-name">Firma Adı</FieldLabel>
            <Input
              id="firm-name"
              {...register("name")}
              placeholder="Firma adı"
            />
            <FieldDescription>{errors.name?.message}</FieldDescription>
          </Field>

          <Separator />
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              DIA Bağlantı Ayarları
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.diaUsername}>
                <FieldLabel htmlFor="dia-username">
                  DIA Kullanıcı Adı
                </FieldLabel>
                <Input
                  id="dia-username"
                  {...register("diaUsername")}
                  placeholder="kullanici_adi"
                />
                <FieldDescription>
                  {errors.diaUsername?.message}
                </FieldDescription>
              </Field>

              <Field data-invalid={!!errors.diaPassword}>
                <FieldLabel htmlFor="dia-password">DIA Şifresi</FieldLabel>
                <Input
                  id="dia-password"
                  type="password"
                  {...register("diaPassword")}
                  placeholder="••••••••"
                />
                <FieldDescription>
                  {errors.diaPassword?.message}
                </FieldDescription>
              </Field>

              <Field data-invalid={!!errors.diaApiKey}>
                <FieldLabel htmlFor="dia-api-key">API Anahtarı</FieldLabel>
                <Input
                  id="dia-api-key"
                  {...register("diaApiKey")}
                  placeholder="api-key-here"
                />
                <FieldDescription>{errors.diaApiKey?.message}</FieldDescription>
              </Field>

              <Field data-invalid={!!errors.diaFirmCode}>
                <FieldLabel htmlFor="dia-firm-code">Firma Kodu</FieldLabel>
                <Input
                  id="dia-firm-code"
                  type="number"
                  {...register("diaFirmCode")}
                  placeholder="0"
                />
                <FieldDescription>
                  {errors.diaFirmCode?.message}
                </FieldDescription>
              </Field>

              <Field data-invalid={!!errors.diaPeriodCode}>
                <FieldLabel htmlFor="dia-period-code">Dönem Kodu</FieldLabel>
                <Input
                  id="dia-period-code"
                  type="number"
                  {...register("diaPeriodCode")}
                  placeholder="0"
                />
                <FieldDescription>
                  {errors.diaPeriodCode?.message}
                </FieldDescription>
              </Field>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">İptal</Button>
            </DialogClose>
            <Button className="cursor-pointer" type="submit">
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
