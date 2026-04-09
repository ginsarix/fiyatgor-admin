import { z } from "zod";

export const firmSchema = z.object({
  firmCode: z.string().min(1, { error: "Firma kodu boş olamaz" }),
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
});
