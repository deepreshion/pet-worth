import { z } from "zod";
import { localDateString } from "./medicalEvents";

function optionalNumber() {
  return z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number({ error: "NUMBER_INVALID" }).optional(),
  );
}

export function createPetFormSchema(today = localDateString()) {
  return z
    .object({
      name: z.string().trim().min(1, "NAME_REQUIRED").max(80, "NAME_TOO_LONG"),
      species: z.enum(["cat", "dog"], { error: "SPECIES_REQUIRED" }),
      breed: z.string().max(100, "BREED_TOO_LONG").optional(),
      sex: z.enum(["female", "male", "unknown"]).optional(),
      birthMode: z.enum(["unknown", "exact", "approximate"]),
      birthDate: z.string().optional(),
      ageYears: optionalNumber().pipe(
        z
          .number()
          .int("AGE_YEARS_INVALID")
          .min(0, "AGE_YEARS_INVALID")
          .max(40, "AGE_YEARS_INVALID")
          .optional(),
      ),
      ageMonths: optionalNumber().pipe(
        z
          .number()
          .int("AGE_MONTHS_INVALID")
          .min(0, "AGE_MONTHS_INVALID")
          .max(11, "AGE_MONTHS_INVALID")
          .optional(),
      ),
      weightKg: optionalNumber().pipe(
        z
          .number()
          .positive("WEIGHT_NOT_POSITIVE")
          .max(200, "WEIGHT_TOO_LARGE")
          .optional(),
      ),
    })
    .superRefine((value, ctx) => {
      if (
        value.birthMode === "exact" &&
        (!value.birthDate || value.birthDate > today)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["birthDate"],
          message: "BIRTH_DATE_INVALID",
        });
      }
      if (
        value.birthMode === "approximate" &&
        !(Number(value.ageYears || 0) || Number(value.ageMonths || 0))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ageYears"],
          message: "AGE_REQUIRED",
        });
      }
    });
}
