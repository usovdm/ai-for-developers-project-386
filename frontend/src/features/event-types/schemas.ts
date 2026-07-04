import { z } from "zod";

export const eventTypeFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  durationMinutes: z.union([z.literal(15), z.literal(30), z.literal(45)]),
});

export type EventTypeFormValues = z.infer<typeof eventTypeFormSchema>;
