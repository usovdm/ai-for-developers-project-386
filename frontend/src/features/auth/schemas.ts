import { z } from "zod";

export const adminLoginSchema = z.object({
  login: z.string().min(1, "Login is required"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
