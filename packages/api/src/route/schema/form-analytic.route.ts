import { z } from "zod";

export const formAnalyticBodySchema = z.object({
  //   range:  z.number().min(7).max(365),

  range: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "Range must be a valid number",
    })
    .refine((val) => val >= 7 && val <= 365, {
      message: "Range must be between 7 and 365",
    }),
});

export const updateCountAndAverageBodySchema = z.object({
  duration: z.number(),
});
