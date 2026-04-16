import { z } from "zod";

export const editFirmSchema = z.object({
  firmCode: z.string().optional(),
  name: z.string().optional(),
  diaUsername: z.string().optional(),
  diaPassword: z.string().optional(),
  diaApiKey: z.string().optional(),
  diaFirmCode: z
    .preprocess(
      (val) => {
        if (val === "" || val === null) return undefined; // convert empty string to undefined
        return Number(val);
      },
      z
        .number({ error: "Dia firma kodu boş olamaz" })
        .int({ error: "Firma kodu geçerli bir sayı olmalıdır" })
        .positive({ error: "Firma kodu geçerli bir sayı olmalıdır" })
        .optional(),
    )
    .optional(),
  diaPeriodCode: z
    .preprocess(
      (val) => {
        if (val === "" || val === null) return undefined; // convert empty string to undefined
        return Number(val);
      },
      z
        .number({ error: "Dönem kodu boş olamaz" })
        .int({ error: "Dönem kodu geçerli bir sayı olmalıdır" })
        .min(0, { error: "Dönem kodu 0 veya daha büyük olmalıdır" })
        .optional(),
    )
    .optional(),

  priceField: z
    .enum([
      "fiyat1",
      "fiyat2",
      "fiyat3",
      "fiyat4",
      "fiyat5",
      "fiyat6",
      "fiyat7",
      "fiyat8",
      "fiyat9",
      "fiyat10",
    ])
    .default("fiyat1")
    .optional(),

  maxProductNameCharacters: z.preprocess(
    (v) => (v === "" || v === null || Number.isNaN(v) ? null : v),
    z
      .number({
        error: "Ürün adı uzunluğu geçerli bir sayı olmalıdır",
      })
      .int({
        error: "Ürün adı uzunluğu geçerli bir sayı olmalıdır",
      })
      .positive({
        error: "Ürün adı uzunluğu geçerli bir sayı olmalıdır",
      })
      .nullish()
      .default(null),
  ),
});

export const stockRowSchema = z.object({
  stockCode: z.string().min(1, { error: "Stok Kart Kodu boş olamaz" }),
  name: z.string().min(1, { error: "Ürün adı boş olamaz" }),
  price: z.string().default("0"),
  currency: z.string().default("TRY"),
  vat: z.coerce.number().default(0),
  minQuantity: z.coerce.number().default(1),
  unit: z.string().default("AD"),
  barcodes: z.string().array().max(5),
});
