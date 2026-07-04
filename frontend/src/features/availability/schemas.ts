import { z } from "zod";

const dayOfWeekSchema = z.union([
  z.literal("monday"),
  z.literal("tuesday"),
  z.literal("wednesday"),
  z.literal("thursday"),
  z.literal("friday"),
  z.literal("saturday"),
  z.literal("sunday"),
]);

export const availabilityFormSchema = z
  .object({
    workDays: z.array(dayOfWeekSchema).min(1, "At least one work day is required"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: "End time must be later than start time",
    path: ["endTime"],
  });

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;
