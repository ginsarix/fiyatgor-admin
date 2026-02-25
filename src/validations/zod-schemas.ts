import { z } from "zod";

export const firmSchema = z.object({
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
        .number()
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
        .number()
        .int({ error: "Firma kodu geçerli bir sayı olmalıdır" })
        .min(0, { error: "Dönem kodu 0 veya daha büyük olmalıdır" })
        .optional(),
    )
    .optional(),
});
