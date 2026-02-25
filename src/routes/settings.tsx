import { zodResolver } from "@hookform/resolvers/zod";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import {
  BuildingIcon,
  KeyRoundIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserCircle2Icon,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { axios } from "@/config/api";
import { firmQueryKey, meQueryKey } from "@/constants/queryKeys";
import { filterEmptyFields } from "@/lib/utils";
import { sessionAtom } from "@/state/atoms/session";
import { store } from "@/state/store";
import { firmSchema } from "@/validations/zod-schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: number;
  firmId: number;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  createdAt: string;
  updatedAt: string | null;
};

type Firm = {
  id: number;
  name: string;
  diaServerCode: string;
  diaUsername: string;
  diaPassword: string;
  diaApiKey: string;
  diaFirmCode: number;
  diaPeriodCode: number | null;
  createdAt: string;
  updatedAt: string | null;
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const userSchema = z
  .object({
    name: z.string().min(1, { message: "Ad Soyad boş olamaz" }),
    email: z.email({ message: "Lütfen geçerli bir e-posta giriniz" }),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, { message: "Yeni şifre en az 8 karakter olmalıdır" })
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    {
      message: "Mevcut şifrenizi girmeniz gerekiyor",
      path: ["currentPassword"],
    },
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword)
        return false;
      return true;
    },
    { message: "Şifreler eşleşmiyor", path: ["confirmPassword"] },
  );

type UserFormValues = z.infer<typeof userSchema>;
type FirmFormValues = z.infer<typeof firmSchema>;

// ─── Query Options ─────────────────────────────────────────────────────────────

const meQueryOptions = (serverCode: string) =>
  queryOptions({
    queryKey: [meQueryKey],
    queryFn: async () =>
      (
        await axios.get<{ message: string; user: User }>("/admin/me", {
          params: { serverCode },
        })
      ).data,
    retry: false,
  });

const firmQueryOptions = (serverCode: string) =>
  queryOptions({
    queryKey: [firmQueryKey],
    queryFn: async () =>
      (
        await axios.get<{ message: string; firm: Firm }>("/admin/firm", {
          params: { serverCode },
        })
      ).data,
    retry: false,
  });

// ─── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/settings")({
  loader: async ({ context }) => {
    const { serverCode } = store.get(sessionAtom)!;
    await Promise.all([
      context.queryClient.prefetchQuery(meQueryOptions(serverCode)),
      context.queryClient.prefetchQuery(firmQueryOptions(serverCode)),
    ]);
  },
  pendingComponent: () => <Spinner className="size-6" />,
  component: ProfileRouteComponent,
});

// ─── Component ─────────────────────────────────────────────────────────────────

function ProfileRouteComponent() {
  const { serverCode } = useAtomValue(sessionAtom)!;
  const queryClient = useQueryClient();

  const meQuery = useQuery(meQueryOptions(serverCode));
  const firmQuery = useQuery(firmQueryOptions(serverCode));

  const user =
    meQuery.data && "user" in meQuery.data ? meQuery.data.user : null;

  // ── User Form ──
  const {
    register: registerUser,
    handleSubmit: handleUserSubmit,
    formState: { errors: userErrors },
    reset: resetUser,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      resetUser({
        name: user.name,
        email: user.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user, resetUser]);

  const userMutation = useMutation({
    mutationFn: async (data: UserFormValues) =>
      (
        await axios.patch<{ message: string; user: User }>(
          "/admin/me",
          {
            name: data.name,
            email: data.email,
            ...(data.newPassword
              ? {
                  currentPassword: data.currentPassword,
                  newPassword: data.newPassword,
                }
              : {}),
          },
          { params: { serverCode } },
        )
      ).data,
    onSuccess: ({ user: updatedUser }) => {
      toast("Profil güncellendi", {
        description: "Kullanıcı bilgileriniz başarıyla kaydedildi.",
      });
      resetUser((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      queryClient.setQueryData([meQueryKey], {
        message: "Kullanıcınız başarıyla getirildi",
        user: updatedUser,
      });
    },
    onError: (error) => toast(error.message),
  });

  // ── Firm Form ──
  const {
    register: registerFirm,
    handleSubmit: handleFirmSubmit,
    formState: { errors: firmErrors },
    reset: resetFirm,
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
    const data = firmQuery.data;
    if (data && "firm" in data) {
      resetFirm({
        name: data.firm.name,
        diaUsername: data.firm.diaUsername,
        diaPassword: data.firm.diaPassword,
        diaApiKey: data.firm.diaApiKey,
        diaFirmCode: data.firm.diaFirmCode,
        diaPeriodCode: data.firm.diaPeriodCode ?? 0,
      });
    }
  }, [firmQuery.data, resetFirm]);

  const firmMutation = useMutation({
    mutationFn: async (data: FirmFormValues) => {
      const payload = filterEmptyFields(data);
      return (
        await axios.patch<{ message: string; updatedFirm: Firm }>(
          "/admin/firm",
          payload,
          { params: { serverCode } },
        )
      ).data;
    },
    onSuccess: ({ updatedFirm }) => {
      toast("Firma güncellendi", {
        description: "Firma bilgileriniz başarıyla kaydedildi.",
      });
      queryClient.setQueryData([firmQueryKey], {
        message: "Firma başarıyla getirildi",
        firm: updatedFirm,
      });
    },
    onError: (error) => toast(error.message),
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <UserCircle2Icon className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {user?.name ?? "Profil"}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.role && (
              <Badge
                variant={user.role === "superadmin" ? "default" : "secondary"}
                className="text-xs"
              >
                <ShieldCheckIcon className="mr-1 h-3 w-3" />
                {user.role === "superadmin" ? "Süper Yönetici" : "Yönetici"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Kullanıcı Bilgileri ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCircle2Icon className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Kullanıcı Bilgileri</CardTitle>
              <CardDescription className="text-xs">
                Adınızı, e-posta adresinizi ve şifrenizi güncelleyin
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form
          noValidate
          onSubmit={handleUserSubmit((data) => userMutation.mutateAsync(data))}
        >
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!userErrors.name}>
                <FieldLabel htmlFor="name">Ad Soyad</FieldLabel>
                <Input
                  id="name"
                  {...registerUser("name")}
                  placeholder="Adınız"
                />
                <FieldDescription>{userErrors.name?.message}</FieldDescription>
              </Field>
              <Field data-invalid={!!userErrors.email}>
                <FieldLabel htmlFor="email">E-posta</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  {...registerUser("email")}
                  placeholder="ornek@mail.com"
                />
                <FieldDescription>{userErrors.email?.message}</FieldDescription>
              </Field>
            </div>

            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2">
                <KeyRoundIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Şifre Değiştir</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field data-invalid={!!userErrors.currentPassword}>
                  <FieldLabel htmlFor="current-password">
                    Mevcut Şifre
                  </FieldLabel>
                  <Input
                    id="current-password"
                    type="password"
                    {...registerUser("currentPassword")}
                    placeholder="••••••••"
                  />
                  <FieldDescription>
                    {userErrors.currentPassword?.message}
                  </FieldDescription>
                </Field>
                <Field data-invalid={!!userErrors.newPassword}>
                  <FieldLabel htmlFor="new-password">Yeni Şifre</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    {...registerUser("newPassword")}
                    placeholder="••••••••"
                  />
                  <FieldDescription>
                    {userErrors.newPassword?.message}
                  </FieldDescription>
                </Field>
                <Field data-invalid={!!userErrors.confirmPassword}>
                  <FieldLabel htmlFor="confirm-password">
                    Şifre Tekrar
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    {...registerUser("confirmPassword")}
                    placeholder="••••••••"
                  />
                  <FieldDescription>
                    {userErrors.confirmPassword?.message}
                  </FieldDescription>
                </Field>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                className="flex cursor-pointer items-center gap-2"
                disabled={userMutation.isPending}
              >
                {userMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                {userMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* ── Firma Bilgileri ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Firma Bilgileri</CardTitle>
              <CardDescription className="text-xs">
                DIA entegrasyon ayarlarını yönetin
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form
          noValidate
          onSubmit={handleFirmSubmit((data) => firmMutation.mutateAsync(data))}
        >
          <CardContent className="space-y-4">
            <Field data-invalid={!!firmErrors.name}>
              <FieldLabel htmlFor="firm-name">Firma Adı</FieldLabel>
              <Input
                id="firm-name"
                {...registerFirm("name")}
                placeholder="Firma adı"
              />
              <FieldDescription>{firmErrors.name?.message}</FieldDescription>
            </Field>

            <Separator />

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                DIA Bağlantı Ayarları
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Sunucu kodu read-only, session'dan geliyor */}
                <Field>
                  <FieldLabel htmlFor="dia-server-code">Sunucu Kodu</FieldLabel>
                  <Input
                    id="dia-server-code"
                    value={serverCode}
                    disabled
                    className="text-muted-foreground"
                  />
                </Field>

                <Field data-invalid={!!firmErrors.diaUsername}>
                  <FieldLabel htmlFor="dia-username">
                    DIA Kullanıcı Adı
                  </FieldLabel>
                  <Input
                    id="dia-username"
                    {...registerFirm("diaUsername")}
                    placeholder="kullanici_adi"
                  />
                  <FieldDescription>
                    {firmErrors.diaUsername?.message}
                  </FieldDescription>
                </Field>

                <Field data-invalid={!!firmErrors.diaPassword}>
                  <FieldLabel htmlFor="dia-password">DIA Şifresi</FieldLabel>
                  <Input
                    id="dia-password"
                    type="password"
                    {...registerFirm("diaPassword")}
                    placeholder="••••••••"
                  />
                  <FieldDescription>
                    {firmErrors.diaPassword?.message}
                  </FieldDescription>
                </Field>

                <Field data-invalid={!!firmErrors.diaApiKey}>
                  <FieldLabel htmlFor="dia-api-key">API Anahtarı</FieldLabel>
                  <Input
                    id="dia-api-key"
                    {...registerFirm("diaApiKey")}
                    placeholder="api-key-here"
                  />
                  <FieldDescription>
                    {firmErrors.diaApiKey?.message}
                  </FieldDescription>
                </Field>

                <Field data-invalid={!!firmErrors.diaFirmCode}>
                  <FieldLabel htmlFor="dia-firm-code">Firma Kodu</FieldLabel>
                  <Input
                    id="dia-firm-code"
                    type="number"
                    {...registerFirm("diaFirmCode")}
                    placeholder="0"
                  />
                  <FieldDescription>
                    {firmErrors.diaFirmCode?.message}
                  </FieldDescription>
                </Field>

                <Field data-invalid={!!firmErrors.diaPeriodCode}>
                  <FieldLabel htmlFor="dia-period-code">Dönem Kodu</FieldLabel>
                  <Input
                    id="dia-period-code"
                    type="number"
                    {...registerFirm("diaPeriodCode")}
                    placeholder="0"
                  />
                  <FieldDescription>
                    {firmErrors.diaPeriodCode?.message}
                  </FieldDescription>
                </Field>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                className="flex cursor-pointer items-center gap-2"
                disabled={firmMutation.isPending}
              >
                {firmMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                {firmMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
