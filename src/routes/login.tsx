import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { EyeClosedIcon, EyeIcon, LogInIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { axios } from "@/config/api";
import { loginMutationKey } from "@/constants/mutationKeys";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

const schema = z.object({
  email: z.email({ error: "Lütfen geçerli bir e-posta giriniz" }),
  password: z.string().min(1, { error: "Lütfen parolanızı giriniz" }),
});

function LoginComponent() {
  const location = useLocation();
  const navigate = Route.useNavigate();

  const loginMutation = useMutation({
    mutationKey: [loginMutationKey],
    mutationFn: async (data: z.infer<typeof schema>) => {
      return (await axios.post<{ message: string }>("/auth/sessions", data))
        .data;
    },
    onSuccess: () => {
      navigate({
        to: (location.search as { redirect?: string }).redirect ?? "/",
        replace: true,
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });
  const onSubmit = handleSubmit(async (data) => {
    await loginMutation.mutateAsync(data);
  });

  const [passwordVisibility, setPasswordVisibility] = useState(false);

  return (
    <div className="w-full max-w-xs space-y-8">
      {/* Identity mark */}
      <div className="space-y-1">
        <div className="font-mono text-xl font-bold tracking-tight">
          <span className="text-primary">▪</span>{" "}fiyatgör
        </div>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.18em]">
          Yönetici Girişi
        </p>
      </div>

      {loginMutation.isError && (
        <div className="border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {isAxiosError(loginMutation.error)
            ? loginMutation.error.response?.data.message
            : "Beklenmeyen bir hata oluştu"}
        </div>
      )}

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <Field className="gap-1.5" data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <Input
            id="email"
            {...register("email")}
            placeholder="ornek@mail.com"
            type="email"
            autoComplete="work email"
            required
            aria-invalid={!!errors.email}
          />
          <FieldDescription>{errors.email?.message}</FieldDescription>
        </Field>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className={cn(!!errors.password && "text-destructive")}
          >
            Parola
          </Label>
          <Field
            data-invalid={!!errors.password}
            orientation="horizontal"
            className="gap-1.5"
          >
            <Input
              id="password"
              {...register("password")}
              placeholder="••••••••"
              type={passwordVisibility ? "text" : "password"}
              autoComplete="current-password"
              required
              aria-invalid={!!errors.password}
            />
            <Button
              type="button"
              onClick={() =>
                setPasswordVisibility((prevVisibility) => !prevVisibility)
              }
              size="icon"
              variant="outline"
            >
              {passwordVisibility ? <EyeClosedIcon /> : <EyeIcon />}
            </Button>
          </Field>
          <FieldDescription>{errors.password?.message}</FieldDescription>
        </div>

        <div className="pt-2">
          <Button className="w-full cursor-pointer" type="submit">
            {!loginMutation.isPending ? (
              <>
                Giriş Yap
                <LogInIcon />
              </>
            ) : (
              <>
                Giriş yapılıyor
                <Spinner />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
