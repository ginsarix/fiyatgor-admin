import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { read, utils } from "xlsx";
import { z } from "zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { axios } from "@/config/api";
import { productsQueryKey } from "@/constants/queryKeys";
import { sessionAtom } from "@/state/atoms/session";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "./ui/field";
import { Input } from "./ui/input";

const BARCODE_KEYS = [
  "barcode1",
  "barcode2",
  "barcode3",
  "barcode4",
  "barcode5",
] as const;

const productRowFormSchema = z.object({
  stockCode: z.string().min(1, { error: "Stok Kart Kodu boş olamaz" }),
  name: z.string().min(1, { error: "Ürün adı boş olamaz" }),
  price: z.string(),
  currency: z.string(),
  unit: z.string(),
  barcode1: z.string(),
  barcode2: z.string(),
  barcode3: z.string(),
  barcode4: z.string(),
  barcode5: z.string(),
});

const formSchema = z.object({
  deleteStale: z.boolean(),
  products: z.array(productRowFormSchema),
});

type FormValues = z.infer<typeof formSchema>;

const EMPTY_ROW: z.infer<typeof productRowFormSchema> = {
  stockCode: "",
  name: "",
  price: "0",
  currency: "TRY",
  unit: "AD",
  barcode1: "",
  barcode2: "",
  barcode3: "",
  barcode4: "",
  barcode5: "",
};

export function ProductAdd() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { deleteStale: false, products: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  const deleteStale = watch("deleteStale");

  const { serverCode } = useAtomValue(sessionAtom)!;

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const products = data.products.map(
        ({ barcode1, barcode2, barcode3, barcode4, barcode5, ...p }) => ({
          ...p,
          barcodes: [barcode1, barcode2, barcode3, barcode4, barcode5].filter(
            Boolean,
          ),
        }),
      );

      return (
        await axios.post(
          "/admin/products/raw",
          {
            products,
            deleteStale: data.deleteStale,
          },
          { params: { serverCode } },
        )
      ).data;
    },
    onSuccess: () => {
      toast("Ürünler kaydedildi");
      queryClient.invalidateQueries({ queryKey: [productsQueryKey] });
      setOpen(false);
      reset();
    },
    onError: (error) => toast(error.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    const parsed: z.infer<typeof productRowFormSchema>[] = rows.map((row) => ({
      stockCode: String(row["Stok Kodu"] ?? row["stockCode"] ?? ""),
      name: String(row["Ürün Adı"] ?? row["Ürün Adi"] ?? row["name"] ?? ""),
      price: String(row["Fiyat"] ?? row["price"] ?? "0"),
      currency: String(row["Döviz"] ?? row["currency"] ?? "TRY"),
      unit: String(row["Birim"] ?? row["unit"] ?? "AD"),
      barcode1: String(row["Barkod 1"] ?? ""),
      barcode2: String(row["Barkod 2"] ?? ""),
      barcode3: String(row["Barkod 3"] ?? ""),
      barcode4: String(row["Barkod 4"] ?? ""),
      barcode5: String(row["Barkod 5"] ?? ""),
    }));

    setValue("products", parsed, { shouldValidate: true });
    e.target.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Ürün Ekle</Button>
      </DialogTrigger>
      <DialogContent className="flex w-full max-w-lg flex-col">
        <form
          className="contents"
          noValidate
          onSubmit={handleSubmit((data) => mutation.mutateAsync(data))}
        >
          <DialogHeader>
            <DialogTitle>Ürün Ekle</DialogTitle>
            <DialogDescription>
              Excel tablonuzdan veya manuel olarak ürünlerinizi ekleyin
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="size-4" />
              Excel'den Yükle
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => append(EMPTY_ROW)}
            >
              <PlusIcon className="size-4" />
              Ürün Ekle
            </Button>
            {fields.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {fields.length} ürün
              </span>
            )}
          </div>

          {fields.length > 0 && (
            <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative rounded-md border p-3 pt-4"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 size-6 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>

                  <div className="flex flex-col gap-2">
                    <Field data-invalid={!!errors.products?.[index]?.stockCode}>
                      <FieldLabel>Stok Kodu</FieldLabel>
                      <Input
                        {...register(`products.${index}.stockCode`)}
                        placeholder="SKU001"
                      />
                    </Field>

                    <Field data-invalid={!!errors.products?.[index]?.name}>
                      <FieldLabel>Ürün Adı</FieldLabel>
                      <Input
                        {...register(`products.${index}.name`)}
                        placeholder="Ürün adı"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-2">
                      <Field>
                        <FieldLabel>Fiyat</FieldLabel>
                        <Input
                          {...register(`products.${index}.price`)}
                          placeholder="0"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Döviz</FieldLabel>
                        <Input
                          {...register(`products.${index}.currency`)}
                          placeholder="TRY"
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel>Birim</FieldLabel>
                      <Input
                        {...register(`products.${index}.unit`)}
                        placeholder="AD"
                      />
                    </Field>

                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Barkodlar</FieldLabel>
                      {BARCODE_KEYS.map((key, i) => (
                        <Input
                          key={key}
                          {...register(`products.${index}.${key}`)}
                          placeholder={`Barkod ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox
                id="delete-old-checkbox"
                checked={deleteStale}
                onCheckedChange={(checked) =>
                  setValue("deleteStale", !!checked)
                }
                className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
              />
              <FieldContent>
                <FieldLabel htmlFor="delete-old-checkbox">
                  Eski ürünleri sil
                </FieldLabel>
                <FieldDescription>
                  Mevcut ürünleri tutmak istemiyorsanız bu kutucuğu işaretleyin;
                  yeni listede bulunmayan tüm stok kodları silinecektir.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">İptal</Button>
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={mutation.isPending || fields.length === 0}
            >
              {mutation.isPending ? "Kaydediliyor..." : "Tamam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
