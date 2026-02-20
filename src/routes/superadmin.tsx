import { zodResolver } from "@hookform/resolvers/zod";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BuildingIcon, PlusIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DataTable } from "@/components/data-table";
import { type FirmSummary, firmsColumns } from "@/components/firms-columns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { type UserSummary, usersColumns } from "@/components/users-columns";
import { axios } from "@/config/api";
import { firmsQueryKey, superAdminUsersQueryKey } from "@/constants/queryKeys";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreatedFirm = FirmSummary & {
  diaUsername: string;
  diaApiKey: string | null;
  diaPeriodCode: number | null;
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const firmSchema = z.object({
  name: z.string().min(1, { message: "Firma adı boş olamaz" }),
  diaServerCode: z.string().min(1, { message: "Sunucu kodu boş olamaz" }),
  diaUsername: z.string().min(1, { message: "DIA kullanıcı adı boş olamaz" }),
  diaPassword: z.string().min(1, { message: "DIA şifresi boş olamaz" }),
  diaApiKey: z.string().optional(),
  diaFirmCode: z
    .number()
    .int()
    .positive({ message: "Geçerli bir firma kodu giriniz" }),
  diaPeriodCode: z.number().int().min(0).optional(),
});

const jobSchema = z.object({
  frequency: z
    .number()
    .int()
    .positive({ message: "Sıklık 0'dan büyük olmalıdır" }),
  unit: z.enum(["minute", "hour", "day", "month"]),
});

const createFirmSchema = z.object({
  firm: firmSchema,
  // job is conditionally validated in the component via withJob toggle
  job: jobSchema.optional(),
});

const createUserSchema = z.object({
  name: z.string().min(1, { message: "Ad Soyad boş olamaz" }),
  email: z.email({ message: "Lütfen geçerli bir e-posta giriniz" }),
  password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır" }),
  firmId: z.number().int().positive({ message: "Bir firma seçiniz" }),
  role: z.enum(["admin", "superadmin"]),
});

type CreateFirmValues = z.infer<typeof createFirmSchema>;
type CreateUserValues = z.infer<typeof createUserSchema>;

// ─── Query Options ─────────────────────────────────────────────────────────────

const firmsQueryOptions = queryOptions({
  queryKey: [firmsQueryKey],
  queryFn: async () =>
    (
      await axios.get<{ message: string; firms: FirmSummary[] }>(
        "/superadmin/firms",
      )
    ).data,
  retry: false,
});

const usersQueryOptions = queryOptions({
  queryKey: [superAdminUsersQueryKey],
  queryFn: async () =>
    (
      await axios.get<{ message: string; users: UserSummary[] }>(
        "/superadmin/users",
      )
    ).data,
  retry: false,
});

// ─── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/superadmin")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(firmsQueryOptions),
      context.queryClient.prefetchQuery(usersQueryOptions),
    ]);
  },
  pendingComponent: () => <Spinner className="size-6" />,
  component: SuperAdminRouteComponent,
});

// ─── Component ─────────────────────────────────────────────────────────────────

function SuperAdminRouteComponent() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(firmsQueryOptions);
  const { data: usersData } = useSuspenseQuery(usersQueryOptions);
  const firms = data.firms;
  const users = usersData.users;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-5">
      <FirmsTable firms={firms} />
      <UsersTable users={users} />
      <CreateFirmCard
        onCreated={(firm) => {
          queryClient.setQueryData(
            firmsQueryOptions.queryKey,
            (prev: { message: string; firms: FirmSummary[] } | undefined) => ({
              message: prev?.message ?? "",
              firms: [...(prev?.firms ?? []), firm],
            }),
          );
        }}
      />
      <CreateUserCard firms={firms} />
    </div>
  );
}

// ─── Firms Table ──────────────────────────────────────────────────────────────

function FirmsTable({ firms }: { firms: FirmSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Firmalar</CardTitle>
            <CardDescription className="text-xs">
              Sisteme kayıtlı tüm firmalar
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={firmsColumns} data={firms} pageSize={5} />
      </CardContent>
    </Card>
  );
}

// ─── Users Table ──────────────────────────────────────────────────────────────

function UsersTable({ users }: { users: UserSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Kullanıcılar</CardTitle>
            <CardDescription className="text-xs">
              Sisteme kayıtlı tüm kullanıcılar
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={usersColumns} data={users} pageSize={5} />
      </CardContent>
    </Card>
  );
}

// ─── Create Firm Card ──────────────────────────────────────────────────────────

function CreateFirmCard({
  onCreated,
}: {
  onCreated: (firm: CreatedFirm) => void;
}) {
  const [withJob, setWithJob] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateFirmValues>({
    resolver: zodResolver(createFirmSchema),
    defaultValues: {
      firm: {
        name: "",
        diaServerCode: "",
        diaUsername: "",
        diaPassword: "",
        diaApiKey: "",
        diaFirmCode: undefined,
        diaPeriodCode: undefined,
      },
      job: { frequency: undefined, unit: "day" },
    },
  });

  const jobUnit = watch("job.unit");

  const mutation = useMutation({
    mutationFn: async (data: CreateFirmValues) =>
      (
        await axios.post<{ message: string; createdFirm: CreatedFirm }>(
          "/superadmin/firms",
          // omit job from payload if the toggle is off
          withJob ? data : { firm: data.firm },
        )
      ).data,
    onSuccess: ({ createdFirm }) => {
      toast("Firma oluşturuldu", {
        description: `${createdFirm.name} başarıyla eklendi.`,
      });
      reset();
      setWithJob(false);
      onCreated(createdFirm);
    },
    onError: (error) => toast(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Firma Ekle</CardTitle>
            <CardDescription className="text-xs">
              Yeni bir firma ve isteğe bağlı arka plan görevi oluşturun
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form
        noValidate
        onSubmit={handleSubmit((data) => mutation.mutateAsync(data))}
      >
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field className="col-span-2" data-invalid={!!errors.firm?.name}>
              <FieldLabel htmlFor="firm-name">Firma Adı</FieldLabel>
              <Input
                id="firm-name"
                {...register("firm.name")}
                placeholder="Örnek A.Ş."
              />
              <FieldDescription>{errors.firm?.name?.message}</FieldDescription>
            </Field>

            <Field data-invalid={!!errors.firm?.diaServerCode}>
              <FieldLabel htmlFor="server-code">Sunucu Kodu</FieldLabel>
              <Input
                id="server-code"
                {...register("firm.diaServerCode")}
                placeholder="SRV001"
              />
              <FieldDescription>
                {errors.firm?.diaServerCode?.message}
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.firm?.diaFirmCode}>
              <FieldLabel htmlFor="firm-code">Firma Kodu</FieldLabel>
              <Input
                id="firm-code"
                type="number"
                {...register("firm.diaFirmCode", { valueAsNumber: true })}
                placeholder="1"
              />
              <FieldDescription>
                {errors.firm?.diaFirmCode?.message}
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.firm?.diaUsername}>
              <FieldLabel htmlFor="dia-username">DIA Kullanıcı Adı</FieldLabel>
              <Input
                id="dia-username"
                {...register("firm.diaUsername")}
                placeholder="kullanici_adi"
              />
              <FieldDescription>
                {errors.firm?.diaUsername?.message}
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.firm?.diaPassword}>
              <FieldLabel htmlFor="dia-password">DIA Şifresi</FieldLabel>
              <Input
                id="dia-password"
                type="password"
                {...register("firm.diaPassword")}
                placeholder="••••••••"
              />
              <FieldDescription>
                {errors.firm?.diaPassword?.message}
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.firm?.diaApiKey}>
              <FieldLabel htmlFor="dia-api-key">API Anahtarı</FieldLabel>
              <Input
                id="dia-api-key"
                {...register("firm.diaApiKey")}
                placeholder="api-key"
              />
              <FieldDescription>
                {errors.firm?.diaApiKey?.message}
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.firm?.diaPeriodCode}>
              <FieldLabel htmlFor="period-code">Dönem Kodu</FieldLabel>
              <Input
                id="period-code"
                type="number"
                {...register("firm.diaPeriodCode", { valueAsNumber: true })}
                placeholder="0"
              />
              <FieldDescription>
                {errors.firm?.diaPeriodCode?.message}
              </FieldDescription>
            </Field>
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Checkbox
              id="with-job"
              checked={withJob}
              onCheckedChange={(v) => setWithJob(!!v)}
            />
            <Label htmlFor="with-job" className="cursor-pointer text-sm">
              Arka plan görevi ekle
            </Label>
          </div>

          {withJob && (
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.job?.frequency}>
                <FieldLabel htmlFor="job-frequency">Sıklık</FieldLabel>
                <Input
                  id="job-frequency"
                  type="number"
                  {...register("job.frequency", { valueAsNumber: true })}
                  placeholder="1"
                />
                <FieldDescription>
                  {errors.job?.frequency?.message}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="job-unit">Birim</FieldLabel>
                <Select
                  value={jobUnit}
                  onValueChange={(v) =>
                    setValue(
                      "job.unit",
                      v as NonNullable<CreateFirmValues["job"]>["unit"],
                    )
                  }
                >
                  <SelectTrigger id="job-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">Dakikada bir</SelectItem>
                    <SelectItem value="hour">Saatte bir</SelectItem>
                    <SelectItem value="day">Günde bir</SelectItem>
                    <SelectItem value="month">Ayda bir</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              className="flex cursor-pointer items-center gap-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              {mutation.isPending ? "Oluşturuluyor..." : "Firma Oluştur"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

// ─── Create User Card ──────────────────────────────────────────────────────────

function CreateUserCard({ firms }: { firms: FirmSummary[] }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      firmId: undefined,
      role: "admin",
    },
  });

  const selectedRole = watch("role");
  const selectedFirmId = watch("firmId");

  const mutation = useMutation({
    mutationFn: async (data: CreateUserValues) =>
      (await axios.post<{ message: string }>("/superadmin/users", data)).data,
    onSuccess: () => {
      toast("Kullanıcı oluşturuldu", {
        description: "Yeni kullanıcı başarıyla sisteme eklendi.",
      });
      reset();
    },
    onError: (error) => toast(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlusIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Kullanıcı Ekle</CardTitle>
            <CardDescription className="text-xs">
              Bir firmaya yeni kullanıcı oluşturun
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form
        noValidate
        onSubmit={handleSubmit((data) => mutation.mutateAsync(data))}
      >
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="user-name">Ad Soyad</FieldLabel>
              <Input
                id="user-name"
                {...register("name")}
                placeholder="Ad Soyad"
              />
              <FieldDescription>{errors.name?.message}</FieldDescription>
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="user-email">E-posta</FieldLabel>
              <Input
                id="user-email"
                type="email"
                {...register("email")}
                placeholder="ornek@mail.com"
              />
              <FieldDescription>{errors.email?.message}</FieldDescription>
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="user-password">Şifre</FieldLabel>
              <Input
                id="user-password"
                type="password"
                {...register("password")}
                placeholder="••••••••"
              />
              <FieldDescription>{errors.password?.message}</FieldDescription>
            </Field>

            <Field data-invalid={!!errors.role}>
              <FieldLabel htmlFor="user-role">Rol</FieldLabel>
              <Select
                value={selectedRole}
                onValueChange={(v) =>
                  setValue("role", v as CreateUserValues["role"])
                }
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Süper Admin</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>{errors.role?.message}</FieldDescription>
            </Field>

            <Field className="col-span-2" data-invalid={!!errors.firmId}>
              <FieldLabel htmlFor="user-firm">Firma</FieldLabel>
              <Select
                value={selectedFirmId?.toString()}
                onValueChange={(v) => setValue("firmId", Number(v))}
              >
                <SelectTrigger id="user-firm">
                  <SelectValue placeholder="Firma seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {firms.map((firm) => (
                    <SelectItem key={firm.id} value={firm.id.toString()}>
                      {firm.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({firm.diaServerCode})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{errors.firmId?.message}</FieldDescription>
            </Field>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              className="flex cursor-pointer items-center gap-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <UserPlusIcon className="h-4 w-4" />
              )}
              {mutation.isPending ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
