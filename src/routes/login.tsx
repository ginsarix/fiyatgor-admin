import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { EyeClosedIcon, EyeIcon, LogInIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Hesabınıza giriş yapınız</CardTitle>
        <CardDescription>
          E-posta ve şifrenizi girip giriş yapabilirsiniz
        </CardDescription>
        {loginMutation.isError && (
          <div className="bg-red-500 p-4 rounded-lg mt-2">
            {isAxiosError(loginMutation.error)
              ? loginMutation.error.response?.data.message
              : "Beklenmeyen bir hata oluştu"}
          </div>
        )}
      </CardHeader>

      <form noValidate onSubmit={onSubmit}>
        <CardContent className="grid gap-1.5">
          <Field className="gap-1.5" data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">E-posta</FieldLabel>
            <Input
              id="email"
              {...register("email")}
              placeholder="E-posta"
              type="email"
              autoComplete="work email"
              required
              aria-invalid={!!errors.email}
            />
            <FieldDescription className="">
              {errors.email?.message}
            </FieldDescription>
          </Field>
          {/* not putting this in the inlined field cuz this label should not be inline */}
          <Label
            htmlFor="password"
            className={cn(!!errors.password && "text-destructive")}
          >
            Parola
          </Label>{" "}
          <Field
            data-invalid={!!errors.password}
            orientation="horizontal"
            className="gap-1.5"
          >
            <Input
              id="password"
              {...register("password")}
              placeholder="Parola"
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
        </CardContent>
        <CardFooter className="mt-5">
          <Button className="cursor-pointer ml-auto" type="submit">
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
        </CardFooter>
      </form>
    </Card>
  );
}
